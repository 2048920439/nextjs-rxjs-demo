export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修复 bug
        "docs", // 文档变更
        "style", // 代码格式（不影响代码运行）
        "refactor", // 重构
        "perf", // 性能优化
        "test", // 测试相关
        "build", // 构建系统或外部依赖变更
        "ci", // CI 配置变更
        "chore", // 其他杂项
        "revert", // 回滚
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
  },
};
