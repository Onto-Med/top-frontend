if [[ ! -z "${AUTH_ENABLED}" ]]
then
    sed -i "s|AUTH_ENABLED\\:!1|AUTH_ENABLED:${AUTH_ENABLED}|g" /usr/share/nginx/html/js/app.*.js
fi

if [[ ! -z "${API_URL}" ]]
then
    sed -i "s|API_URL\\:\"http\\://127\\.0\\.0\\.1\\:8080\"|API_URL:'${API_URL}'|g" /usr/share/nginx/html/js/app.*.js
fi

if [[ ! -z "${OAUTH2_URL}" ]]
then
    sed -i "s|OAUTH2_URL\\:\"http\\://127\\.0\\.0\\.1\\:8081\"|OAUTH_URL:'${OAUTH2_URL}'|g" /usr/share/nginx/html/js/app.*.js
fi

if [[ ! -z "${OAUTH2_REALM}" ]]
then
    sed -i "s|OAUTH2_REALM\\:\"top-realm\"|OAUTH_REALM:'${OAUTH2_REALM}'|g" /usr/share/nginx/html/js/app.*.js
fi

if [[ ! -z "${OAUTH2_CLIENT_ID}" ]]
then
    sed -i "s|OAUTH2_CLIENT_ID\\:\"top-frontend\"|OAUTH_CLIENT_ID:'${OAUTH2_CLIENT_ID}'|g" /usr/share/nginx/html/js/app.*.js
fi

if [[ ! -z "${GDPR_NOTICE}" ]]
then
    sed -i "s|GDPR_NOTICE\\:!1|GDPR_NOTICE:${GDPR_NOTICE}|g" /usr/share/nginx/html/js/app.*.js
fi

if [[ ! -z "${GDPR_POLICY_URL}" ]]
then
    sed -i "s|GDPR_POLICY_URL\\:void 0|GDPR_POLICY_URL:'${GDPR_POLICY_URL}'|g" /usr/share/nginx/html/js/app.*.js
fi