import axios from 'axios'
import mockServer from "./mock-server"
import { afterEach } from 'vitest'

interface Response {
    query: Record<string, any>
    body: Record<string, any>
    queryPolluted: Record<string, any> | undefined
    bodyPolluted: Record<string, any> | undefined
}

axios.interceptors.response.use(res => {
    return res.data
}, err => {
    return Promise.reject(err)
})

afterEach(() => { mockServer.close() })

describe("hpp", () => {
    describe("should validate the options and works", () => {
        it('by turning off the whitelist for invalid type', function () {
            // @ts-ignore
            expect(() => { mockServer.start({ whitelist: ["a", 123, [1, 2, 3]] }) }).toThrowError("[HPP] Please pass only strings into the array. Removed the entry <' + 1 + '>")
            // @ts-ignore
            expect(() => { mockServer.start({ queryWhitelist: [123, [1, 2, 3]] }) }).toThrowError("[HPP] Please pass only strings into the array. Removed the entry <' + 0 + '>")
            // @ts-ignore
            expect(() => { mockServer.start({ bodyWhitelist: [[1, 2, 3]] }) }).toThrowError("[HPP] Please pass only strings into the array. Removed the entry <' + 0 + '>")
        });
    })

    describe("should queryWhitelist option is valid and check ctx.query", () => {
        it("by turning off the checkQuery option", async () => {
            mockServer.start({ queryWhitelist: ["a"], checkQuery: false });
            let data = await axios.get<any, Response>("http://127.0.0.1:3333/", { params: { a: 1, b: 2 } })
            expect(data.query).toEqual({ a: "1", b: "2" });
            expect(data.queryPolluted).toEqual(undefined);
            expect(data.body).toEqual({});
            expect(data.bodyPolluted).toEqual(undefined);
        })
        it("by turning on the checkQuery option", async () => {
            mockServer.start({ queryWhitelist: ["a"] });
            let data = await axios.get<any, Response>("http://127.0.0.1:3333/", { params: { a: 1, b: 2 } })
            expect(data.query).toEqual({ a: "1" });
            expect(data.queryPolluted).toEqual({ b: "2" });
            expect(data.body).toEqual({});
            expect(data.bodyPolluted).toEqual(undefined);
        })
        it("set queryWhitelist and whitelist option at the same time", async () => {
            mockServer.start({ queryWhitelist: ["a"], whitelist: ["b"] });
            let data = await axios.get<any, Response>("http://127.0.0.1:3333/", { params: { a: 1, b: 2, c: 3, d: 4 } })
            expect(data.query).toEqual({ a: "1", b: "2" });
            expect(data.queryPolluted).toEqual({ c: "3", d: "4" });
            expect(data.body).toEqual({});
            expect(data.bodyPolluted).toEqual(undefined);
        })
        it("with two or more same querys", async () => {
            mockServer.start({ queryWhitelist: ["a"] })
            let data = await axios.get<any, Response>("http://127.0.0.1:3333/?a=1&a=222&b=2")
            expect(data.query).toEqual({ a: "222" });
            expect(data.queryPolluted).toEqual({ a: ["1", "222"], b: "2" });
            expect(data.body).toEqual({});
            expect(data.bodyPolluted).toEqual(undefined);
        })
        it("with two or more hpp Middleware", async () => {
            mockServer.start([{ queryWhitelist: ["a", "b", "c"] }, { queryWhitelist: ["a", "b"] }, { queryWhitelist: ["a"] }, { whitelist: [] }])
            let data = await axios.get<any, Response[]>("http://127.0.0.1:3333/?a=1&a=222&b=2&c=3")
            expect(data[0].query).toEqual({ a: "222", b: "2", c: "3" });
            expect(data[0].queryPolluted).toEqual({ a: ["1", "222"] });
            expect(data[0].body).toEqual({});
            expect(data[0].bodyPolluted).toEqual(undefined);

            expect(data[1].query).toEqual({ a: "222", b: "2" });
            expect(data[1].queryPolluted).toEqual({ a: ["1", "222"], c: "3" });
            expect(data[1].body).toEqual({});
            expect(data[1].bodyPolluted).toEqual(undefined);

            expect(data[2].query).toEqual({ a: "222" });
            expect(data[2].queryPolluted).toEqual({ a: ["1", "222"], b: "2", c: "3" });
            expect(data[2].body).toEqual({});
            expect(data[2].bodyPolluted).toEqual(undefined);

            expect(data[3].query).toEqual({});
            expect(data[3].queryPolluted).toEqual({ a: ["1", "222"], b: "2", c: "3" });
            expect(data[3].body).toEqual({});
            expect(data[3].bodyPolluted).toEqual(undefined);
        })
    })

    describe("should bodyWhitelist option is valid and check ctx.request.body", () => {
        it("by turning off the checkBody option", async () => {
            mockServer.start({ bodyWhitelist: ["a"], checkBody: false });
            let data = await axios.post<any, Response>("http://127.0.0.1:3333/", { a: 1, b: 2 })
            expect(data.query).toEqual({});
            expect(data.queryPolluted).toEqual(undefined);
            expect(data.body).toEqual({ a: 1, b: 2 });
            expect(data.bodyPolluted).toEqual(undefined);
        })
        it("by turning on the checkBody option", async () => {
            mockServer.start({ bodyWhitelist: ["a"] });
            let data = await axios.post<any, Response>("http://127.0.0.1:3333/", { a: 1, b: 2 })
            expect(data.query).toEqual({});
            expect(data.queryPolluted).toEqual(undefined);
            expect(data.body).toEqual({ a: 1 });
            expect(data.bodyPolluted).toEqual({ b: 2 });
        })
        it("set bodyWhitelist and whitelist option at the same time", async () => {
            mockServer.start({ bodyWhitelist: ["a"], whitelist: ["b"] });
            let data = await axios.post<any, Response>("http://127.0.0.1:3333/", { a: 1, b: 2, c: 3, d: 4 })
            expect(data.query).toEqual({});
            expect(data.queryPolluted).toEqual(undefined);
            expect(data.body).toEqual({ a: 1, b: 2 });
            expect(data.bodyPolluted).toEqual({ c: 3, d: 4 });
        })
        it("with two or more hpp Middleware", async () => {
            mockServer.start([{ bodyWhitelist: ["a", "b", "c"] }, { bodyWhitelist: ["a", "b"] }, { bodyWhitelist: ["a"] }, { whitelist: [] }])
            let data = await axios.post<any, Response[]>("http://127.0.0.1:3333/", { a: 1, b: 2, c: 3 })
            expect(data[0].body).toEqual({ a: 1, b: 2, c: 3 });
            expect(data[0].bodyPolluted).toEqual({});
            expect(data[0].query).toEqual({});
            expect(data[0].queryPolluted).toEqual(undefined);

            expect(data[1].body).toEqual({ a: 1, b: 2 });
            expect(data[1].bodyPolluted).toEqual({ c: 3 });
            expect(data[1].query).toEqual({});
            expect(data[1].queryPolluted).toEqual(undefined);

            expect(data[2].body).toEqual({ a: 1 });
            expect(data[2].bodyPolluted).toEqual({ b: 2, c: 3 });
            expect(data[2].query).toEqual({});
            expect(data[2].queryPolluted).toEqual(undefined);

            expect(data[3].body).toEqual({});
            expect(data[3].bodyPolluted).toEqual({ a: 1, b: 2, c: 3 });
            expect(data[3].query).toEqual({});
            expect(data[3].queryPolluted).toEqual(undefined);
        })
    })

    describe("should check both", () => {
        it("with unset any option", async () => {
            mockServer.start()
            let data = await axios.post<any, Response>("http://127.0.0.1:3333/", { a: 1, b: 2 }, { params: { a: 1, b: 2 } })
            expect(data.query).toEqual({ a: "1", b: "2" });
            expect(data.queryPolluted).toEqual(undefined);
            expect(data.body).toEqual({ a: 1, b: 2 });
            expect(data.bodyPolluted).toEqual(undefined);
        })
        it('with one and more params', async () => {
            mockServer.start({ whitelist: ["a"] })
            let data = await axios.post<any, Response>("http://127.0.0.1:3333/", { a: 1, b: 2 }, { params: { a: 1, b: 2 } })
            expect(data.query).toEqual({ a: "1" });
            expect(data.queryPolluted).toEqual({ b: "2" });
            expect(data.body).toEqual({ a: 1 });
            expect(data.bodyPolluted).toEqual({ b: 2 });
        })
        it("with two or more hpp Middleware", async () => {
            mockServer.start([{ whitelist: ["a", "b", "c"] }, { whitelist: ["a", "b"] }, { whitelist: ["a"] }, { whitelist: [] }])
            let data = await axios.post<any, Response[]>("http://127.0.0.1:3333/?a=1&a=222&b=2&c=3", { a: 1, b: 2, c: 3 })
            expect(data[0].query).toEqual({ a: "222", b: "2", c: "3" });
            expect(data[0].queryPolluted).toEqual({ a: ["1", "222"] });
            expect(data[0].body).toEqual({ a: 1, b: 2, c: 3 });
            expect(data[0].bodyPolluted).toEqual({});

            expect(data[1].query).toEqual({ a: "222", b: "2" });
            expect(data[1].queryPolluted).toEqual({ a: ["1", "222"], c: "3" });
            expect(data[1].body).toEqual({ a: 1, b: 2 });
            expect(data[1].bodyPolluted).toEqual({ c: 3 });

            expect(data[2].query).toEqual({ a: "222" });
            expect(data[2].queryPolluted).toEqual({ a: ["1", "222"], b: "2", c: "3" });
            expect(data[2].body).toEqual({ a: 1 });
            expect(data[2].bodyPolluted).toEqual({ b: 2, c: 3 });

            expect(data[3].query).toEqual({});
            expect(data[3].queryPolluted).toEqual({ a: ["1", "222"], b: "2", c: "3" });
            expect(data[3].body).toEqual({});
            expect(data[3].bodyPolluted).toEqual({ a: 1, b: 2, c: 3 });
        })
    })
})
