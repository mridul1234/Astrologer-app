const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ({ types: t }) => ({
        name: "astrowalla-expo-router-root",
        visitor: {
          MemberExpression(memberPath, state) {
            if (!memberPath.get("object").matchesPattern("process.env")) return;
            const key = memberPath.toComputedKey();
            if (!t.isStringLiteral(key) || key.value !== "EXPO_ROUTER_APP_ROOT") return;
            const from = path.dirname(state.filename || __filename);
            memberPath.replaceWith(t.stringLiteral(path.relative(from, path.join(__dirname, "apps", "mobile", "app"))));
          },
        },
      }),
    ],
  };
};
