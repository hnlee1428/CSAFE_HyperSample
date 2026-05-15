#include <drogon/drogon.h>
#include <cmath>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace drogon;

double log_choose(int a, int b) {
    if (b < 0 || b > a) return -INFINITY;
    return lgamma(a + 1.0) - lgamma(b + 1.0) - lgamma(a - b + 1.0);
}

double dhyper_cpp(int x, int K, int N_minus_K, int n) {
    if (x < 0 || x > K) return 0.0;
    if (n - x < 0 || n - x > N_minus_K) return 0.0;
    double logp = log_choose(K, x)
                + log_choose(N_minus_K, n - x)
                - log_choose(K + N_minus_K, n);
    return std::exp(logp);
}

// For the Plot tab (/ncalc): return confidence level as a function of n
// for one fixed allowed number of negatives m.
Json::Value ncalc_curve(int N, double q, int allowed_no_negatives) {
    int K = static_cast<int>(N * q);
    int positives = N - K;

    Json::Value arr(Json::arrayValue);
    int ones_kept = 0;

    for (int n = 1; n <= N; ++n) {
        double verify_n = static_cast<double>(n - allowed_no_negatives) / n;
        if (verify_n <= q) continue;

        double prob = 0.0;
        for (int i = 0; i <= allowed_no_negatives; ++i) {
            prob += dhyper_cpp(i, K, positives, n);
        }

        double confidence = 1.0 - prob;
        bool rounded_to_one = (std::round(confidence * 1000.0) / 1000.0 == 1.0);

        if (rounded_to_one) {
            ones_kept++;
            if (ones_kept > 10) continue;
        }

        Json::Value row;
        row["n"] = n;
        row["confidence_level"] = confidence;
        row["N"] = N;
        row["q"] = q;
        row["allowed_no_negatives"] = allowed_no_negatives;
        arr.append(row);
    }

    return arr;
}

// For the Table tab (/table): return the minimum sample size n for each m
// that achieves the selected confidence level.
Json::Value n_calculate_f(int N, double q, int m_min, int m_max, double alpha) {
    int K = static_cast<int>(N * q);
    int positives = N - K;
    double target_confidence = 1.0 - alpha;

    Json::Value result(Json::objectValue);
    Json::Value rows(Json::arrayValue);

    bool has_infeasible_m = false;
    Json::Value infeasible_m_values(Json::arrayValue);

    for (int m = m_min; m <= m_max; ++m) {
        int required_n = -1;
        double achieved_confidence = 0.0;

        for (int n = 1; n <= N; ++n) {
            double verify_n = static_cast<double>(n - m) / n;
            if (verify_n <= q) continue;

            double prob = 0.0;
            for (int i = 0; i <= m; ++i) {
                prob += dhyper_cpp(i, K, positives, n);
            }

            double confidence = 1.0 - prob;

            if (confidence >= target_confidence) {
                required_n = n;
                achieved_confidence = confidence;
                break;
            }
        }

        if (required_n != -1) {
            Json::Value row;
            row["allowed_no_negatives"] = m;
            row["sample_size"] = required_n;
            row["confidence_level"] = achieved_confidence;
            rows.append(row);
        } else {
            has_infeasible_m = true;
            infeasible_m_values.append(m);
        }
    }

    result["rows"] = rows;
    result["has_infeasible_m"] = has_infeasible_m;
    result["infeasible_m_values"] = infeasible_m_values;
    result["target_confidence_level"] = target_confidence;
    result["N"] = N;
    result["q"] = q;

    return result;
}

void inference_handler(const HttpRequestPtr& req,
                       std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    Json::Value out;

    if (!json) {
        out["error"] = "Missing JSON body.";
        callback(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    int N = (*json)["N"].asInt();
    int n = (*json)["n"].asInt();
    int x = (*json)["x"].asInt();
    double alpha = (*json)["alpha"].asDouble();

    if (!(N >= n && n >= x && x >= 0)) {
        out["error"] = "Make sure that N >= n >= x and x >= 0.";
        callback(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    int K_alpha = 1;
    double prob = 1.0;
    int answer = 1;

    while (prob > alpha && K_alpha <= N) {
        prob = 0.0;
        for (int xx = 0; xx <= x; ++xx) {
            prob += dhyper_cpp(xx, K_alpha, N - K_alpha, n);
        }
        answer = K_alpha;
        K_alpha++;
    }
    


    double K_over_N = 1.0 * answer / N;
double one_minus_K_over_N = 1.0 * (N-answer) / N;

    out["K_upper_bound"] = answer;
    out["N_minus_K_upper_bound"] = N - answer;

    
    out["confidence_percent"] = static_cast<int>(100.0 * (1.0 - alpha));
    out["x_observed"] = x;
    out["rounded_up_K_over_N"] = std::ceil(K_over_N * 10000.0) / 10000.0;
   out["rounded_up_one_minus_K_over_N"] = std::floor(one_minus_K_over_N * 10000.0) / 10000.0;


    callback(HttpResponse::newHttpJsonResponse(out));
}

void ncalc_handler(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    Json::Value out;

    if (!json) {
        out["error"] = "Missing JSON body.";
        callback(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    int N = (*json)["N"].asInt();
    double q = (*json)["q"].asDouble();
    int m = (*json)["m"].asInt();

    if (N < 1 || q < 0.0 || q > 1.0 || m < 0) {
        out["error"] = "Invalid input values.";
        callback(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    callback(HttpResponse::newHttpJsonResponse(ncalc_curve(N, q, m)));
}

void table_handler(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    Json::Value out;

    if (!json) {
        out["error"] = "Missing JSON body.";
        callback(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    int N = (*json)["N"].asInt();
    double q = (*json)["q"].asDouble();
    int m_min = (*json)["m_min"].asInt();
    int m_max = (*json)["m_max"].asInt();
    double alpha = (*json)["alpha"].asDouble();

    if (N < 1 || q < 0.0 || q > 1.0 || alpha <= 0.0 || alpha >= 1.0 || m_min < 0 || m_max < m_min) {
        out["error"] = "Invalid input values. Make sure N >= 1, 0 <= q <= 1, 0 < alpha < 1, and m_min <= m_max.";
        callback(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    callback(HttpResponse::newHttpJsonResponse(n_calculate_f(N, q, m_min, m_max, alpha)));
}

int main() {
    app()
        .registerPreRoutingAdvice(
            [](const HttpRequestPtr &req,
               drogon::FilterCallback &&stop,
               drogon::FilterChainCallback &&pass) {
                if (req->method() == drogon::Options) {
                    auto resp = HttpResponse::newHttpResponse();
                    resp->setStatusCode(k200OK);
                    resp->addHeader("Access-Control-Allow-Origin", "http://localhost:5500");
                    resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
                    stop(resp);
                    return;
                }
                pass();
            })

        .registerPostHandlingAdvice(
            [](const HttpRequestPtr &req, const HttpResponsePtr &resp) {
                resp->addHeader("Access-Control-Allow-Origin", "http://localhost:5500");
                resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
            });

    app().registerHandler("/inference", &inference_handler, {Post});
    app().registerHandler("/ncalc", &ncalc_handler, {Post});
    app().registerHandler("/table", &table_handler, {Post});

    app().addListener("0.0.0.0", 8080);
    app().run();
}
