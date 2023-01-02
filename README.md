# Axel's Static Server
A simple static file/proxy server for vscode. No code injection, no special
features. Just static files and simple proxies so you can develop in peace.

## Usage
Place a `static-serve.yml` file in the root of the first folder in the
workspace. Next section has details on options in the file.

## static-serve.yml Format
```yml
# the port to listen on
port: 45067
# optional
# adds headers to the response from all sources (static or proxy)
headers:
  cache-control: no-cache
# the list of sources to pull from. will go in the order defined until it gets
# a response or dies trying
sources:
  # dir is a path to look for static files
  - dir: static
  - dir: other
    # headers can be added to any individual source and will be merged with the
    # the top level headers defined (if any). source headers have precedence
    headers:
      blep: blep!
  - dir: /some/absolute/path
  # proxy can be used to route requests to some other service or api
  - proxy: https://postman-echo.com
```
