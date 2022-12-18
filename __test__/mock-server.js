// Before test, you must start the server.
import koa from "koa"
import Router from "@koa/router"
import hpp from "../dist/index.js"
import bodyParser from "koa-bodyparser"
import multer from "@koa/multer"

const app = new koa()

// 必须添加 body 解析，才能对 body 进行过滤
app.use(bodyParser())
app.use(multer().single())

// 全部通过
app.use(hpp()).use((ctx, next) => {
    console.log("全部通过", ctx.request.body);
    console.log("全部通过", ctx.state.bodyPolluted);
    // console.log("全部通过", ctx.query);
    // console.log("全部通过", ctx.state.queryPolluted);
    next()
})

app.listen(3333, () => {
    console.log("server start in port 3333");
})
