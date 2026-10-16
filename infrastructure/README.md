# Schema deployment

`schema.open-rpc.org` serves compatibility schemas independently of the legacy
`meta.open-rpc.org` service. The [CloudFormation template](schema-hosting.yaml)
defines the hosting; deployed identifiers and audit evidence stay outside Git.

## Provisioning

Deploy the template in `us-east-1` for the CloudFront certificate. It reuses an
existing public Route 53 zone and GitHub OIDC provider in the deployment account.
Supply deployment-specific names through local configuration:

```sh
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name "$SCHEMA_STACK_NAME" \
  --template-file infrastructure/schema-hosting.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    HostedZoneId="$SCHEMA_HOSTED_ZONE_ID" \
    SchemaBucketName="$SCHEMA_BUCKET" \
    DeploymentRoleName="$SCHEMA_DEPLOY_ROLE_NAME"
```

Use the existing bucket and role names when updating a stack; changing names can
replace resources. Store the resulting deployment identifiers in the environment
secrets below. Keep local parameter files and stack outputs out of Git.

CloudFront retains S3's `x-amz-meta-release-*` response headers, which the deploy
and Pages freshness checks require. Request-header cache settings do not control
those response headers. Verify them during the first release; see
[AWS's S3 response behavior](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RequestAndResponseBehaviorS3Origin.html#ResponseS3).

## GitHub configuration

Configure the `schema-production` environment to permit deployments from `master`
only. Its OIDC role must trust the repository/environment subject and the
`sts.amazonaws.com` audience. Configure these encrypted environment secrets so
GitHub masks deployment identifiers in public Actions logs:

| Environment secret | Purpose |
| --- | --- |
| `AWS_ACCOUNT_ID` | Expected AWS account for credential validation |
| `AWS_ROLE_ARN` | OIDC deployment role |
| `SCHEMA_BUCKET` | Destination bucket |
| `SCHEMA_DISTRIBUTION_ID` | Distribution to invalidate |

Set `AWS_REGION` as an environment variable. No long-lived AWS access keys are
needed. The role needs bucket list/read/write and distribution invalidation
permissions; it does not need object deletion or infrastructure-management access.

Public schema objects use `Content-Type: application/json` and
`Cache-Control: public, max-age=60, s-maxage=60, must-revalidate`.
`/` returns `302 Location: /latest`; unknown versions return errors.

## Release deployment and retries

The release workflow checks the exact release PR merge commit before Knope/npm
publication. Only after that job succeeds does `deploy-schema` assume the OIDC
role in `schema-production`, requesting a 20-minute session. It runs no dependency
installation with AWS credentials available. Actions in the release and Pages
workflows are pinned to commit SHAs.

Merge the Knope release PR using a merge commit. The workflow requires a valid
`merge_commit_sha` in its event and stops before checkout if it is missing.
Reruns reuse that event, so a missing SHA needs investigation rather than repeated
retries. Pages publishes only through successful releases, not on master pushes.

`bun run schema-release-check` validates source identities and selects eligible
compatibility lines offline. A stable package version `1.4.2` selects `1.4` for
latest and includes source lines through `1.4`; a future `1.5` directory is excluded.
`bun run deploy:schema` additionally requires `RELEASE_COMMIT` to match the checkout,
plus `SCHEMA_BUCKET`, `SCHEMA_DISTRIBUTION_ID`, and AWS credentials.

Before uploading, the script reads every destination's S3 metadata. Every object
it writes records `release-version` and `release-commit`. A newer version on any
destination skips an older deployment, including after an interrupted newer run.
An existing object with missing/invalid metadata, or the same package version from
another commit, fails before writes. Do not remove metadata to bypass this guard;
inspect the release history and object versions if it fails.

Version keys are uploaded first and `latest` last. Existing keys absent from the
release checkout are retained. All uploaded paths are invalidated, including on
retries, and the script waits for completion before checking public bytes, JSON
and cache headers, release metadata, and the root redirect. Uploads are not atomic:
an interruption may leave some compatibility keys updated. Retrying the same
release commit finishes the deployment; S3 versioning preserves prior versions.

The full release workflow is serialized through schema and Pages publication.
Concurrency uses GitHub's documented [`queue: max`](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
with cancellation disabled; metadata guards also handle older runs queued later.
Pages runs only after successful schema verification, builds the same commit,
and selects latest from its package version. It checks public schema metadata
before building and again before deployment, so a Pages-only retry skips a release
that has already been superseded.

If npm publication succeeded but schema publication failed, rerun the failed jobs
in that release run; avoid rerunning the successful npm publication job. If only
Pages failed, rerun its failed jobs. Authentication, verification, or conflicting
metadata failures require investigation; these checks do not automatically roll
back objects or republish npm packages.
