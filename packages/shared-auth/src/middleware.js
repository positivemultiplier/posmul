var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
export var updateSession = function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var supabaseResponse, supabase, user, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                supabaseResponse = NextResponse.next({
                    request: request,
                });
                supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
                    cookies: {
                        getAll: function () {
                            return request.cookies.getAll();
                        },
                        setAll: function (cookiesToSet) {
                            cookiesToSet.forEach(function (_a) {
                                var name = _a.name, value = _a.value;
                                return request.cookies.set(name, value);
                            });
                            supabaseResponse = NextResponse.next({
                                request: request,
                            });
                            cookiesToSet.forEach(function (_a) {
                                var name = _a.name, value = _a.value, options = _a.options;
                                return supabaseResponse.cookies.set(name, value, options);
                            });
                        },
                    },
                });
                return [4 /*yield*/, supabase.auth.getUser()];
            case 1:
                user = (_a.sent()).data.user;
                if (!user &&
                    !request.nextUrl.pathname.startsWith("/login") &&
                    !request.nextUrl.pathname.startsWith("/auth")) {
                    url = request.nextUrl.clone();
                    url.pathname = "/login";
                    return [2 /*return*/, NextResponse.redirect(url)];
                }
                // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
                // creating a new response object with NextResponse.next() make sure to:
                // 1. Pass the request in it, like so:
                //    const myNewResponse = NextResponse.next({ request })
                // 2. Copy over the cookies, like so:
                //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
                // 3. Change the myNewResponse object to fit your needs, but avoid changing
                //    the cookies!
                // 4. Finally:
                //    return myNewResponse
                // If this is not done, you may be causing the browser and server to go out
                // of sync and terminate the user's session prematurely!
                return [2 /*return*/, supabaseResponse];
        }
    });
}); };
