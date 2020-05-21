
### Are there assets I can use to talk about OpenRPC?

[open-rpc/design](https://github.com/open-rpc/design/) houses all the design assets for OpenRPC

![openrpc-spec-structure](https://github.com/open-rpc/design/raw/master/diagrams/structure/OpenRPC_structure.png)
![openrpc-logo](https://github.com/open-rpc/design/raw/master/png/open-rpc-logo-320x320.png)

### Why should I use OpenRPC to describe my JSON-RPC API?

OpenRPC documents are both machine and human readable and clearly define your API.
Use cases for machine-readable JSON-RPC API definition documents include, but are not limited to:
 - interactive documentation
 - code generation for documentation
 - clients
 - servers
 - mock servers
 - automation of test cases
 - improve maintainability
 - reduce code and mistakes
 - parallel teams building of client/server based on the agreed spec

### Why JSON-RPC?

[REST is pretty ambiguous](https://www.nurkiewicz.com/2015/07/restful-considered-harmful.html). It is unlikely that any two developers will produce the same REST API. JSON-RPC is a serious contender for services because it is simple, JSON based, and protocol agnostic.

There is a growing need for a standard way to describe the critical open source infrastructure that depends on it.

### Is there anywhere I can try OpenRPC?

Yes, you can experiment with OpenRPC using our [Playground](https://playground.open-rpc.org/) tool. There are pre-built examples in playground that can be used for learning and reference.

### What uses JSON-RPC in the wild?

- [Bitcoin](https://en.bitcoinwiki.org/wiki/JSON-RPC)
- [Ethereum Classic](https://github.com/ethereumproject/wiki/wiki/JSON-RPC)
- [Ethereum](https://github.com/ethereum/wiki/wiki/JSON-RPC)
- [Tezos](https://tezos.gitlab.io/alphanet/tutorials/rpc.html)
- [Monero](https://github.com/monero-project/monero)
- [Qtum](https://qtumproject.github.io/qtumjs-doc/)
- [Quorum](https://github.com/jpmorganchase/quorum)
- [Zcash](https://github.com/zcash/zcash)
- [Ripple](https://developers.ripple.com/get-started-with-the-rippled-api.html)
- [Litecoin](https://github.com/litecoin-project/litecoin)
- [Dash](https://github.com/dashpay/dash)
- [Dogecoin](https://github.com/dogecoin/dogecoin)
- [Visual Studio Language Server Extensions](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [Microsoft Language Server](https://docs.microsoft.com/en-us/visualstudio/extensibility/language-server-protocol?view=vs-2017)
- [Microsoft SQL Tools Service](https://github.com/Microsoft/sqltoolsservice/)
- [Kodi](https://kodi.wiki/view/JSON-RPC_API)
- [OpenDaylight](https://www.opendaylight.org/)
- [RANDOM.ORG](https://api.random.org/json-rpc/1/)
- [FreeIPA](https://www.freeipa.org)
- [PPIO](https://www.pp.io)
- [Tarantool](https://github.com/tarantool/nginx_upstream_module)

### Is the specification available in languages other than English?

Currently the specification does not support any languages other than English. However, we are considering possible solutions
to the situation. If you wish to follow or contribute to the discussion it can be found [here](https://github.com/open-rpc/spec/issues/252).
