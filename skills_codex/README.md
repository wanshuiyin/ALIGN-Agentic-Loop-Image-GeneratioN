# ALIGN · Codex skills

两个技能各自完整、自包含，与 `skills/` 中的 Claude Code 版本对应：

| 用途 | Codex 技能 | Claude Code 技能 |
|---|---|---|
| 参考画意临、风格迁移与工艺回放 | [reference-art-loop-codex](reference-art-loop-codex/SKILL.md) | [reference-art-loop](../skills/reference-art-loop/SKILL.md) |
| 方法图、构建回放与 SVG 导出 | [method-figure-loop-codex](method-figure-loop-codex/SKILL.md) | [method-figure-loop](../skills/method-figure-loop/SKILL.md) |

研究、工序、案例和评审问题与对应的 CC 技能一致；Codex 版使用 Codex 元数据、
`$skill-name` 调用和原生子代理评审。两个入口均保留完整正文，不依赖共享教义文件。

Codex 主代理负责研究、代码、渲染和修改；每轮新建一个不继承主对话的
Codex 子代理，只看固定参考图、成图、固定裁片和必要的工序图，给出视觉
审阅。后一轮修改使用前一轮的真实反馈。源码审阅另开任务，不计入盲评。
这是 Codex 内部的独立上下文审阅，不是跨模型互审；不依赖 Claude Code
或外部 Codex MCP。运行环境需要提供子代理、看图和本地渲染能力。

仓库的 `.agents/skills/` 通过相对链接指向这两个目录，供 Codex 在本仓库内发现。
可以直接使用：

```text
$reference-art-loop-codex 清明上河图 → 武汉 → p5.js 手卷，rounds: 8
$method-figure-loop-codex 给定 Figure 1 → 我的方法 → p5.js，rounds: 5
```

同时提供参考图、输出目录，以及方法图要表达的内容。绘画默认 8 轮，方法图默认
5 轮；用户明确指定的预算优先。需要时也可以直接让 Codex 读取技能文件。

一个保留可重放历史的绘画请求示例：

```text
请读取并使用 skills_codex/reference-art-loop-codex/SKILL.md。
以给定《千里江山图》参考图从零编写 p5.js 工艺回放，保存到
./my-qianli-run/。
不要复制或接着原 examples/qianli-process/ 的艺术实现续改；旧评审不计新轮次。
完成 13 个真实审阅版本：R01 是首稿，R02–R13 必须根据前一轮的真实反馈修改后再审。
每轮启用不继承主对话的新 Codex 子代理，只给固定参考图、成图、固定裁片和需要的工序图，
保留可核对的实际反馈、修改理由及当前审阅状态，不用主代理自述代替子代理审阅。
交付最终展示 HTML、每轮能重放当轮画法的冻结 HTML，以及历史版本入口。
旧 HTML 不得引用最后一版画图源码；保留本地 p5 和字体等依赖，检查导出的文件实际能打开。
检查播放、暂停、阶段跳转、倒拖回放一致性和字体；保留每轮截图与 wiki。
已授权的轮次持续做完，不要每轮请求确认；不能看图或代理未返回时如实记录，不虚构轮数或通过。
```

在其他项目使用时，将所需技能目录复制或链接到该项目的 `.agents/skills/`。
只复制 `skills_codex/` 而不接入发现目录时，仍可通过明确的文件路径调用。
Codex 会自动发现技能变化；若列表尚未更新，重新启动 Codex。
[技能发现说明](https://developers.openai.com/codex/skills#where-to-save-skills)。

技能不固定使用某个模型，也不强制统一八轮上限。轮数取自用户请求；
预算用尽时交付实际结果并说明遗留问题，不冒称视觉通过，不要求每轮
人工确认才能继续。最终运行说明、成图、轮次和审阅记录随作品交付。
用户要求可运行的版本历史时，每轮 HTML 需要冻结自己的代码、样式与依赖，
并验证早期版和最终版分别能重放相应画面；单有截图不能替代这个交付。

文件结构：

```text
skills_codex/
├── reference-art-loop-codex/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   └── references/
│       ├── execution-playbook.md
│       ├── reviewer-protocol.md
│       ├── craft-and-replay.md
│       └── qianli-lessons.md
└── method-figure-loop-codex/
    ├── SKILL.md
    └── agents/openai.yaml
```

两份 `SKILL.md` 各自负责完整工作流、评审提示词与约束。
绘画目录的 `references/` 保留独立运行的补充资料，不是执行入口：
`execution-playbook.md` 给从零启动、
HTML 打包、浏览器截图、字体离线检查、逐轮命令、记录格式和恢复步骤；
`reviewer-protocol.md` 包含可填路径直接使用的首轮、后轮和独立源码审阅提示词。
工艺实现细节和旧案例的已验证失败、未验证尝试分别放在另外两份参考文档。
需要这些专题时按需查阅；评审方式、记录范围和 HERO 约束以当前 `SKILL.md` 为准。
