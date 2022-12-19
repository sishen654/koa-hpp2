# koa-hpp2

English | [简体中文](./README-zh.md)

## ✨ Introduce

Koa middleware to **protect against HTTP Parameter Pollution attacks**

**Note**：This library is inspired by the Express middleware [hpp](https://www.npmjs.com/package/hpp). On the basis of the original, there are three more modifications:

-   Only the query parameter name added to the whitelist can automatically get the last item of the array (this is the default behavior in the hpp library)
-   If the **checkBodyOnlyForContentType** attribute is set, it must be completely consistent with the `content-type` carried by the request to take effect (the hpp library uses the [type-is](https://www.npmjs.com/package/type-is) library for judgment, and this library is only for simple comparison)
-   Two new properties have been added to the configurable options:
    -   **queryWhitelist**：Separately configure the whitelist of query parameters
    -   **bodyWhitelist**：Separately configure the whitelist of body parameters



## 📦 Install

```bash
npm i koa-hpp2
yarn add koa-hpp2
pnpm add koa-hpp2
```



## 🌍 TS support

```ts
import * as koa from 'koa';
import { Middleware } from 'koa';

declare type HppOption = Partial<{
    checkQuery: Boolean;	// default is true
    checkBody: Boolean;		// default is true
    checkBodyOnlyForContentType: string[] | "*";	// default is *, which means that any request data type is passed
    whitelist: string[] | "*";	// default is *, representing all passed
    queryWhitelist: string[];	// default is []
    bodyWhitelist: string[];	// default is []
}>;
declare function export_default(option?: HppOption): Middleware<koa.DefaultState, koa.DefaultContext, any>;

export { HppOption, export_default as default };
```



## 🔨 Usage

### query filter

```js
import koa from "koa"
import hpp from "koa-hpp2"

const app = new koa()
app.use(hpp({
    queryWhitelist: ["a"]  
    // Only the parameter named a in the query is allowed to pass
    // and the rest of the parameters are placed in the polluted object
}))
// ...
```

```js
// Case 1: Suppose the following request is sent
let data = await axios.get<any, Response>("http://127.0.0.1:3333/", { params: { a: 1, b: 2 } })
// ctx.query = { a: "1" }
// ctx.state.queryPolluted = { b: "2" }
```

```js
// Case 2: carry multiple same parameters
let data = await axios.get<any, Response>("http://127.0.0.1:3333/?a=1&a=222&b=2")
// ctx.query = { a: "222" }
// ctx.state.queryPolluted = { a: ["1", "222"], b: "2" }
```

### body filter

>   **Note**: koa-bodyparser middleware must be added before parsing body

```js
import koa from "koa"
import bodyParser from "koa-bodyparser"
import hpp from "koa-hpp2"

const app = new koa()
app.use(bodyParser())	// Body parsing must be added to filter the body
app.use(hpp({
    bodyWhitelist: ["a"]  
    // Only the parameter named a in the body is allowed to pass
    // and the rest of the parameters are placed in the tainted object
}))
// ...
```

```js
let data = await axios.post<any, Response>("http://127.0.0.1:3333/", { a: 1, b: 2 })
// ctx.request.body = { a: 1 }
// ctx.state.bodyPolluted = { b: 2 }
```

### filter at the same time

```js
import koa from "koa"
import bodyParser from "koa-bodyparser"
import hpp from "koa-hpp2"

const app = new koa()
app.use(bodyParser())
app.use(hpp({
    whitelist: ["a"]  
    // Only the parameter named a in body and query is allowed to pass
    // and the rest of the parameters are placed in the pollution object
}))
// ...
```

```js
let data = await axios.post<any, Response[]>("http://127.0.0.1:3333/?a=1&a=222&b=2", { a: 1, b: 2, c: 3 })
// ctx.query = { a: "222" }
// ctx.state.queryPolluted = { a: ["1", "222"], b: "2", c: "3" }
// ctx.request.body = { a: 1 }
// ctx.state.bodyPolluted = { b: 2, c: 3 }
```



## ⌨️ More usage details

-   This is a middleware, as the name suggests **can be reused multiple times**, and placed anywhere in the code
-   **Multiple attributes can be used together**: such as `whitelist` with `bodyWhitelist` or `queryWhitelist`, you can even use all three together, which will make your application more robust and flexible
-   `checkQuery` and `checkBody` can directly switch on and off the filter
-   `checkBodyOnlyForContentType` this attribute can control the data type of the requested data
-   If you encounter any problems during use, you can submit an issue to the github community or the gitee community











