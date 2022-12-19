import koa from "koa"
import bodyParser from "koa-bodyparser"
import multer from "@koa/multer"
import hpp from "../dist/index"
import type { HppOption } from "../src/index"

let server: any = null

export default {
    start(options: HppOption | HppOption[] = {}) {
        const app = new koa()

        // 必须添加 body 解析，才能对 body 进行过滤
        app.use(bodyParser())
        app.use(multer().single())
        if (!Array.isArray(options)) options = [options];
        options.forEach(hppOption => {
            app.use(hpp(hppOption)).use((ctx, next) => {
                // 返回数据
                if (!ctx.state.arr) ctx.state.arr = [];
                // 防止对象引用指向同一个问题
                ctx.state.arr.push(JSON.parse(JSON.stringify({
                    query: ctx.query,
                    body: ctx.request.body,
                    queryPolluted: ctx.state.queryPolluted,
                    bodyPolluted: ctx.state.bodyPolluted
                })))
                next()
            })
        })
        app.use((ctx, next) => {
            // 返回数据
            ctx.body = ctx.state.arr[1] ? ctx.state.arr : ctx.state.arr[0]
            next()
        })
        server = app.listen(3333)
    },
    close() {
        if (server) {
            server.close()
            server = null
        }
    }
}
