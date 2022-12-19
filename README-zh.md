# koa-hpp2

[English](./README.md) | 简体中文

## ✨ 介绍

这是一个用于**防护 HTTP 参数污染攻击**的 Koa 中间件

**注意**：这个库灵感是基于 Express 中间件 [hpp](https://www.npmjs.com/package/hpp) 创建的，在原有的基础上，多了三处修改：

-   只有添加到白名单中的 query 参数名，才可以自动获取数组最后一项（在 hpp 库中这个是默认行为）
-   **checkBodyOnlyForContentType** 属性如果进行了设置，必须与请求携带 `content-type` 完全一致才可以生效（hpp库中是使用了 [type-is](https://www.npmjs.com/package/type-is) 这个库进行判断，而本库只是单纯进行比较）
-   可配置选项新添加两个属性：
    -   **queryWhitelist**：单独配置 query 参数的白名单
    -   **bodyWhitelist**：单独配置 body 参数的白名单



## 📦 下载

```bash
npm i koa-hpp2
yarn add koa-hpp2
pnpm add koa-hpp2
```



## 🌍 TS支持

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



## 🔨 使用

### query 过滤

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

### body 过滤

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

### 同时过滤

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



## ⌨️ 更多使用细节

-   这是一个中间件，顾名思义**可以重复使用多次**，并且放置到代码中的任何地方
-   **多个属性可以共同使用**：如 `whitelist` 搭配 `bodyWhitelist` 或者 `queryWhitelist`，你甚至可以三个一起使用，这样会使你的应用程序更加健壮和灵活
-   `checkQuery` 和 `checkBody` 可以对过滤直接进行开关控制
-   `checkBodyOnlyForContentType` 该属性可以对请求的数据的数据类型进行管控
-   如果在使用过程中遇到任何问题，可以到 github 社区或者 gitee 社区 提 issue











