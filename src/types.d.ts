declare module "markdown-toc" {
  function toc(
    content: string,
    options?: Record<string, unknown>,
  ): { content: string };
  namespace toc {
    function insert(content: string, options?: Record<string, unknown>): string;
  }
  export = toc;
}
