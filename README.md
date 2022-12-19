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
    checkQuery: Boolean;	// 默认为 true
    checkBody: Boolean;		// // 默认为 true
    checkBodyOnlyForContentType: string[] | "*";	// 默认为 *，代表任何类型都通过
    whitelist: string[] | "*";	// 默认为 *，代表全部通过
    queryWhitelist: string[];	// 默认为 []
    bodyWhitelist: string[];	// 默认为 []
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
    queryWhitelist: ["a"]  // 只允许 query 中名为 a 的参数通过，其余参数放置于污染对象
}))
// ...
```

```js
// 案例1：假设发送如下请求
let data = await axios.get<any, Response>("http://127.0.0.1:3333/", { params: { a: 1, b: 2 } })
// ctx.query = { a: "1" }
// ctx.state.queryPolluted = { b: "2" }
```

```js
// 案例2：携带多个相同参数
let data = await axios.get<any, Response>("http://127.0.0.1:3333/?a=1&a=222&b=2")
// ctx.query = { a: "222" }
// ctx.state.queryPolluted = { a: ["1", "222"], b: "2" }
```

### body filter

>   **注意**：在解析 body 之前必须添加 koa-bodyparser 中间件

```js
import koa from "koa"
import bodyParser from "koa-bodyparser"
import hpp from "koa-hpp2"

const app = new koa()
app.use(bodyParser())	// 必须添加 body 解析，才能对 body 进行过滤
app.use(hpp({
    bodyWhitelist: ["a"]  // 只允许 body 中名为 a 的参数通过，其余参数放置于污染对象
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
app.use(bodyParser())	// 必须添加 body 解析，才能对 body 进行过滤
app.use(hpp({
    whitelist: ["a"]  // 只允许 body 和 query 中名为 a 的参数通过，其余参数放置于污染对象
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











