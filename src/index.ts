import type { ParameterizedContext, Next, Middleware } from "koa"
import typeis from "type-is"

export interface HppOption {
    checkQuery: Boolean,
    checkBody: Boolean,
    checkBodyOnlyForContentType: string[] | "*",
    whitelist: string[] | "*",
    queryWhiteList: string[],
    bodyWhiteList: string[]
}

function itemIsString(arr: string[]) {
    arr.forEach((t, i) => {
        if (typeof t !== "string") {
            throw new Error(`[HPP] Please pass only strings into the array. Removed the entry <' + ${i} + '>`)
        }
    })
}

export default function (option: Partial<HppOption> = {}) {
    let { whitelist = "*", checkQuery = true, checkBody = true, checkBodyOnlyForContentType = "*", queryWhiteList = [], bodyWhiteList = [] } = option
    // 1 判断存在
    if (!whitelist) throw new Error("Please pass either a string or an string array to options.whitelist")

    // 2 判断数组每一项
    if (Array.isArray(whitelist)) { itemIsString(whitelist) }
    itemIsString(queryWhiteList)
    itemIsString(bodyWhiteList)

    // 3 定义过滤函数
    function _filter(type: "query" | "body", ctx: ParameterizedContext, _whitelist: string[]) {
        // @ts-ignore
        let reqData: Record<string, any> = type === "query" ? ctx[type] : ctx.request.body
        let reqPolluted: Record<string, any> = ctx.state[`${type}Polluted`]
        if (!reqPolluted) {
            let obj = {}
            ctx.state[`${type}Polluted`] = obj
            reqPolluted = obj
        }
        // 只有 _whitelist 存在，才会进行过滤
        if (Array.isArray(_whitelist)) {
            // 1 当值为数组，存进污染对象，且原属性的值只取数组最后一位
            _whitelist.forEach(key => {
                let value = reqData[key]
                // http://127.0.0.1:3333/?a=1&a=222&b=2&c=3: req.query = { a: [ '1', '222' ], b: '2', c: '3' }
                if (Array.isArray(value)) {
                    reqPolluted[key] = value
                    reqData[key] = value[value.length - 1]
                }
            })
            // 2 过滤属性
            for (const key in reqData) {
                if (Object.prototype.hasOwnProperty.call(reqData, key)) {
                    // 获取值
                    const value = reqData[key];
                    // 白名单没有该属性，剔除
                    if (!_whitelist.includes(key)) {
                        reqPolluted[key] = value
                        delete reqData[key];
                    }
                }
            }
        }
    }

    // 4 返回中间件
    const hpp: Middleware = function (ctx: ParameterizedContext, next: Next) {
        // 1 通过全部
        if (whitelist === "*" && !queryWhiteList[0] && !bodyWhiteList[0]) return next();
        // 2 转化为数组
        whitelist = Array.isArray(whitelist) ? whitelist : []
        // 3 过滤
        if (checkQuery && ctx.query) {
            _filter("query", ctx, whitelist.concat(queryWhiteList))
        }
        // @ts-ignore 需要在前面添加 koa-bodyparser 中间件
        if (checkBody && ctx.request.body) {
            let arr = whitelist.concat(bodyWhiteList)
            if (checkBodyOnlyForContentType === "*") _filter("body", ctx, arr);
            else {
                if (Array.isArray(checkBodyOnlyForContentType) && checkBodyOnlyForContentType.includes(ctx.header["content-type"] as string)) {
                    _filter("body", ctx, arr)
                }
            }
        }
        next();
    }
    return hpp
}
