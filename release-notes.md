RubyLLM 2.0 brings more of each provider's API to Ruby and Rails, with new AI operations, explicit conversation controls, and agents that can resume across requests and jobs.

## Highlights

- **Seventeen built-in providers, one Ruby API.** New integrations include Cohere, Deepgram, ElevenLabs, and Ollama Cloud. Providers and protocols are separate, so integrations can reuse existing wire formats.
- **Agents that wait for you.** Human tool approvals, cancellation, and step-by-step loop control work in plain Ruby and persist across Rails jobs.
- **Video, speech, documents, and search.** Generate video and speech, extract text with OCR, rerank search results, and work with multimodal embeddings, files, batches, and hosted research.
- **More capable conversations.** Typed citations, provider-hosted tools and remote MCP, thinking controls, prompt caching, model fallbacks, and context compaction.
- **Usage you can account for.** Track each provider attempt, including retries and fallbacks, with normalized tokens and costs and a historical Rails usage ledger.
- **A consistent Rails integration.** Your app owns chats and messages; RubyLLM maintains its supporting tables. Persisted agents use the same public API and work with Active Storage, Action Text, Active Job, and Hotwire.

```sh
bundle add ruby_llm --version 2.0.0
```

**Upgrading from 1.x?** Read the [upgrade guide](https://rubyllm.com/upgrading/) for API changes and phased Rails migrations. Start with [What's New in 2.0](https://rubyllm.com/whats-new-in-2-0/) for working examples, or continue below for the detailed changes and credits.

## New

### Providers and protocols

- **Seventeen providers are built in.** Cohere, Deepgram, ElevenLabs, and Ollama Cloud join OpenAI, Anthropic, Gemini, Vertex AI, Bedrock, Azure, xAI, DeepSeek, Mistral, OpenRouter, Perplexity, Ollama, and GPUStack. By @crmne. ([a5dbcda9], [71a69a07])
- **Providers can reuse protocols, and one provider can offer several.** Providers own authentication, endpoints, catalogs, and service settings. Protocols own requests, parsing, streaming, and error normalization. Model and operation selection pick the right protocol; `protocol:` provides an explicit override. By @crmne. ([d398354d], [3400654b])
- **The provider coverage comparison is much larger.** The [interactive coverage matrix](https://rubyllm.com/provider-coverage/) compares selected shared features with 1.16 and links each cell to sources, implementation, validation, and restrictions. By @crmne. ([4683f905], [6051a544])
- **OpenAI uses Responses by default.** Chat Completions remains selectable. Responses adds hosted tools, native reasoning replay, citations, file references, and compaction; speech, file transcription, Files, chat batches, and embedding batches use their own operations. Exact request counting uses the Responses input-token endpoint. By @crmne; thanks @mastraus, @andrew-woblavobla, @tpaulshippy, @khasinski, @afurm and @nbelzer. ([0875ce2d], [18d3622e], #213, #785, #770, #786)
- **Anthropic gets document citations, hosted tools, files, batches, and context compaction.** Web search, web fetch, code execution, and remote MCP use named server tools, preserve their native results, and continue paused provider turns. Caching and token counting have Ruby APIs. By @crmne. ([f6c0e660], [18d3622e])
- **Gemini gains managed caches, multimodal embeddings, media generation, and batches.** There are shared aliases for Search, URL context, code execution, Maps grounding, and prepared file-search stores. The optional Interactions protocol adds stateless model conversations and remote MCP; dedicated and streamed file transcription return typed results. Veo generation and extension use the video API. By @crmne. ([fe1f0c5b], [18d3622e])
- **Vertex AI routes hosted models through their native protocols.** Gemini, Anthropic, Mistral, and compatible partner models share one provider configuration. The expanded operations include Imagen and Gemini images, Veo video, speech, transcription, multimodal embeddings, managed caches, GCS files, chat and embedding batches, Discovery Engine reranking, prepared Search datastores, and hosted Deep Research. Some routes require additional APIs, deployments, or storage configuration. By @crmne; thanks @crhbjk2zn2. ([239dbef5], [18d3622e], #659)
- **Bedrock serves Converse and Mantle models through the appropriate protocols.** It adds real inference-profile discovery, credential providers, multimodal input and embeddings, citations, caching, hosted tools, Stability image generation and editing, Luma video jobs, Voxtral transcription, reranking, configured guardrail moderation, S3 files, and chat and embedding batches. Support follows the specific endpoint and model; batch and video jobs need your storage resources. By @crmne; thanks @martinemde, @jscheid and @dlackty. ([44f3cc09], [18d3622e], #754, #454, #861)
- **Azure covers more of both OpenAI and Foundry.** Responses, image generation and edits, speech, transcription, Sora video, files, and chat batches have Azure routing. Hosted partner protocols include Cohere embeddings and reranking, while supported Responses deployments expose hosted tools and compaction. Custom deployment names, resource URLs, API versions, and model availability remain part of Azure setup. By @crmne. ([8fcd3802], [18d3622e])
- **xAI uses its Responses dialect and adds media, files, and batches.** Shared APIs cover web and X search, code execution, file search, MCP, images and image edits, video generation/editing/extension, speech, transcription, tokenization, and manual compaction. Provider-reported request costs are retained. By @crmne. ([28a8ff2b], [18d3622e])
- **DeepSeek adds an optional Responses protocol.** Chat Completions remains the default. The integration handles its thinking controls, structured output, supported image inputs and image-file uploads with expiry. The built-in `:web_search` alias raises `UnsupportedServerToolError` because the current endpoint silently ignores it. Its Files API does not provide downloads. By @crmne. ([4993bd47], [18d3622e])
- **Cohere has a native v2 integration.** Chat and streaming include tools, schemas, thinking, and citations. Standalone operations cover text and image embeddings, reranking, transcription, image OCR through Parse, datasets, chat batches, and embedding batches. Parse accepts images; PDF parsing is not claimed. By @crmne. ([a5dbcda9], [18d3622e])
- **Mistral expands beyond compatible chat.** OCR, speech, diarized and streamed transcription, Files, chat and embedding batches, and stateless Conversations hosted tools have dedicated handling. Hosted image generation also backs `paint`; generated files are downloadable. By @crmne. ([b6575414], [18d3622e])
- **OpenRouter gains an optional Responses route and broader media and retrieval support.** That includes video input and generation, speech, transcription, multimodal embeddings, reranking, files, cache boundaries, compression, hosted shell execution, and exact provider-reported costs. MCP preserves the records OpenRouter actually returns and requires approvals to be disabled. Its batch integration remains subject to the provider's beta rollout. By @crmne. ([390a9a42], [18d3622e])
- **Perplexity citations and embeddings use the provider's actual response and endpoint formats.** An explicitly selected Router Chat Completions protocol adds function tools, tool controls, and cache boundaries for accounts with preview access. Generated-file downloads work from an existing file identifier. Sonar remains the default. By @crmne. ([09546082], [18d3622e])
- **Deepgram and ElevenLabs provide speech and transcription, including streamed results.** Existing recordings can be transcribed over their WebSocket APIs into typed chunks and a final transcript. ElevenLabs also has image/video generation, reference-media handling, and media-asset storage for accounts with the required access. By @crmne. ([757129c6], [18d3622e])
- **Ollama Cloud has its own credentials and provider identity.** It reuses the Ollama chat dialect for the cloud models' supported vision, thinking, and tools. Local Ollama gains audio attachment rendering for audio-capable models and a sufficiently recent server. By @crmne; thanks @dalton-cole. ([16b08a15], [18d3622e], #740)
- **GPUStack uses its current compatible APIs and model catalog.** Depending on the deployed backend, it supports audio/video input, multimodal embeddings, reranking, speech, streamed transcription, Responses, and proxy-based tokenization and video jobs. Model-proxy setup and backend capabilities determine availability; deployment-managed MCP has explicit restrictions. By @crmne. ([b0aa9a9b], [18d3622e])

### Conversations, agents, and tools

- **Tools can wait for a human decision.** Declare `requires_approval`, inspect `awaiting_approval?` and `pending_approvals`, then `approve` or `deny` before continuing. Denials become tool results the model can respond to. The same decisions persist across Rails requests and jobs. By @crmne; thanks @jondavidschober. ([c460d77b], #503)
- **Your application can drive the conversation one step at a time.** `ask_later` stages input, `generate` requests one response, `run_tools` executes pending calls, and `step` advances one generation or tool round. `complete` keeps the automatic loop. Partially completed tool rounds can resume without rerunning results already in the transcript. By @crmne; thanks @jbourassa, @ramontayag and @mtoneil. ([bfbb2d52], [ac87f5ab], #635, #690, #681)
- **A conversation can be cancelled from another request or process.** `cancel` and `cancelled?` work on plain chats, agents, and persisted records. Rails jobs poll outside the query cache, so they see a cancellation written elsewhere. By @crmne; thanks @sh1nj1. ([503d5284], [99a30606], #607)
- **Provider-hosted tools have one registration API.** `with_server_tools` and the Agent `server_tools` macro enable named web search, web fetch, code execution, file search, image generation, and MCP integrations where available. `ServerToolCall` preserves native calls and results, including streamed output and follow-up history. Prepared search indexes remain provider resources you configure separately. By @crmne. ([47a9dfb6], [18d3622e])
- **Remote MCP approvals share the normal approval flow where the provider supports them.** `remote?` distinguishes a provider-executed request from a local Ruby tool, and the call ID identifies the pending decision. A remote call never dispatches a same-named Ruby tool. Providers without an approval lifecycle reject unsupported approval settings. By @crmne. ([18d3622e])
- **Citations are typed values across documents, tool search results, and the web.** Read source URLs, titles, cited passages, page/character positions, file identifiers, and filenames when supplied. Citations survive streaming and Rails persistence. `SearchResults` lets your own retrieval tools return citable documents. By @crmne; thanks @db0sch. ([f6c0e660], [18d3622e], #52)
- **Thinking can use the model's defaults or explicit controls.** `with_thinking` enables it, `with_thinking(false)` disables it where allowed, and `effort:`, `budget:`, and `display:` express supported preferences. Defaults follow model switches and fallbacks; summaries are available through `response.thinking`. By @crmne; thanks @AlexanderMamrenko. ([b6dd4ca8], [c4f9c05b], #714)
- **Fallback models can recover from transient provider or network failures.** `with_fallbacks` preserves the conversation's tools, schema, and settings, with `before_fallback` and `after_fallback` hooks. Usage includes every attempt. Fallbacks need credentials and models that support the requested features. By @crmne; thanks @kieranklaassen. ([ea16d66c], [ac87f5ab], #621, #674)
- **Prompt caching has shared settings and explicit boundaries.** `with_caching` controls supported cache options; `cache_until_here` marks a reusable prefix and persists that boundary on Rails messages. `RubyLLM.cache` creates Gemini or Vertex cached-content resources that can be found, updated, deleted, and reused with `with_caching(id:)`. By @crmne; thanks @arunkumarry. ([3c9f4294], [18d3622e], #706, #716)
- **Long conversations can compact while keeping the application's transcript.** `with_compaction` enables supported automatic behavior. `compact` explicitly calls the OpenAI, Azure, or xAI Responses compaction operation and returns a message with its usage. Later requests use the compacted context while Rails retains the original conversation and current instructions. By @crmne; thanks @fvaleye. ([644c1800], [18d3622e], #763)
- **Output limits and end-user attribution have shared names.** Set `with_max_output_tokens` and `with_end_user`, or the corresponding Agent macros. Read the configured values back through `max_output_tokens`, `temperature`, and `end_user`. Providers translate supported end-user fields. By @crmne; thanks @derikolsson. ([fc724a4e], [38af607f], #789)
- **Tool selection and execution settings are separate from tool registration.** `with_tool_options(choice:, calls:, concurrency:)` controls which tools may run, the number of calls, and the existing thread/fiber execution modes. Tools and individual options can be cleared independently. By @crmne; thanks @juanmanuelramallo. ([959f42cf], [38e5a597], #806)
- **Tools can return attachments alongside text or structured results.** Images, audio, PDFs, and other supported files pass through each protocol's tool-result format. Hash and Array results become JSON text. Parameter inference and the schema DSL remain available, and `Tool.tool_name` exposes the conventional name. By @crmne; thanks @IvanLysikov. ([f62fe516], [9359d160], #858)
- **A tool can inspect the ToolCall being executed.** Declare the optional `tool_call:` keyword to access its ID and metadata without exposing that keyword as a model parameter. By @crmne; thanks @adamcooper. (#833, [f835bb44])
- **Agents can select models at runtime and handle errors declaratively.** Model blocks run with the agent's inputs; `rescue_from` handles configured exceptions around delegated operations. Inherited settings are copied so subclasses can change tools, server tools, fallbacks, and other options independently. By @crmne; thanks @kryzhovnik and @skovy. ([5deb83a5], [446b57ce], #676, #708)
- **Prompt rendering is available outside agents.** `RubyLLM.render_prompt` renders reusable text/ERB prompts with locals and nested paths, including Rails engine prompt paths. Named agents automatically use their conventional prompt when present; a blank prompt means no instructions. By @kryzhovnik and @crmne; thanks @adrianthedev. ([28a3669d], [3096c9ef], #675, #857)
- **Inspect or adapt the next request through public chat methods.** `chat.render` returns the rendered payload with request hooks applied. `before_request` runs after framework formatting and provider-option merging, so it can inspect or change the final payload. Both are delegated through agents and persisted chats. By @crmne. ([9d7d63e8], [d7aa6cec])
- **Responses explain why generation stopped through common readers.** `stopped?`, `max_tokens?`, `tool_call_stop?`, and `content_filtered?` interpret normalized finish reasons across providers, with the same readers on persisted messages. By @crmne; thanks @trevorturk and @losingle. ([9737d1a0], [e0bcf1d4], #568, #709)
- **Plain chats can replace or import their transcript.** `messages =` replaces history, while `add_message` accepts message values or attributes. Rails can copy an existing message into another conversation without moving the original record or creating new provider usage. By @crmne; thanks @mnort9 and @marksweston. ([471fc27c], [08035557], #533, [discussion #495](https://github.com/crmne/ruby_llm/discussions/495))

- **Logs can be directed to a file with RUBYLLM_LOG_FILE.** By @Niraj22; thanks @jordan-brough. (#836, #658)

### Images, video, audio, documents, and search

- **Generate video with `RubyLLM.animate`.** `animate_later` returns a `VideoJob` for polling and collecting a typed `Video`; image references, first/last frames, video edits, and extensions use the same API where the selected model supports them. Integrations include Gemini, Vertex AI, Azure, xAI, OpenRouter, Bedrock, ElevenLabs, and GPUStack. The OpenAI adapter targets its deprecated Sora/Videos API; see the coverage matrix for retirement details. By @crmne. ([5ade6e24], [18d3622e])
- **Turn text into speech with `RubyLLM.speak`.** Select a voice and format, read the typed result, and save it directly. A block yields `SpeechChunk` audio bytes on supported routes while the call still returns the complete `Speech`. Binary HTTP and Mistral SSE streams preserve the provider's usage when available. By @crmne; thanks @salidux and @grgr. ([68fef9e7], [18d3622e], #651, #481)
- **Transcription can include speakers, words, segments, and timestamps.** `speaker_names:`, `speaker_references:`, `timestamps:`, `language:`, and `prompt:` provide the shared controls, subject to provider support. A block yields `TranscriptionChunk` values and a final `Transcription`. SSE and WebSocket integrations transcribe existing audio files; this does not introduce a live conversation API. By @crmne; thanks @patvice. ([b81b1262], [18d3622e], #628)
- **Generate several images with one `paint(n:)` request where supported.** `paint` also gains Gemini image models, broader reference-image editing, mask handling on supported providers, image metadata, and normalized usage and costs. Image size is sent only when requested. By @crmne; thanks @palladius, @myxoh, @zavan and @danieldenis01. ([5f8ed0e7], [18d3622e], #31, #473, #623, #750)
- **Images, videos, speech, and downloaded files save the same way.** Complete results expose `save(path)`, returning the path, and `to_blob` for bytes. These values also fit Active Storage attachment workflows. By @crmne. ([8f2127e4], [38e5a597])
- **Extract document text with `RubyLLM.ocr`.** Mistral Document AI and Cohere Parse return typed pages, combined Markdown, and the provider's page/image/table information. `pages:` selects supported pages; provider-specific annotation/output settings use `provider_options:`. By @crmne. ([b6575414], [18d3622e])
- **Embeddings can combine text with supported media.** `embed(..., with:)` accepts the image, audio, video, or document inputs supported by the chosen embedding model. `task_type:` and `title:` replace hand-built task payloads. Result shapes distinguish a single input from an array, and `sparse_vectors` exposes sparse output when returned. By @crmne; thanks @Ndunge-Makau, @radeno, @goianiense and @adamcooper. ([4fa3bb12], [18d3622e], #529, #788, #824, #810) Bedrock embedding work and recordings also incorporate contributions from @cgmoore120. (#677, [efbe8faf])
- **Rerank retrieved documents with `RubyLLM.rerank`.** Typed results retain original indices, documents, and relevance scores, with `top_n:` to limit results. Integrations cover Cohere, OpenRouter, GPUStack, Bedrock, Vertex AI Search, and Azure Cohere. By @crmne. ([58ace224], [18d3622e])
- **Moderation accepts image input and returns typed assessments.** `Moderation::Result` exposes `flagged?`, categories, and scores; `flagged_categories` combines the flagged names. Configured Bedrock guardrails use the same operation for text and supported images, preserving actual policy assessments without inventing a model, token usage, or price. By @crmne; thanks @decaffeinatedio. ([3998b053], [18d3622e], #724, #723)
- **Inspect token IDs or count a request before generating.** `RubyLLM.tokenize` returns IDs and a count for plain text on xAI and configured GPUStack proxies. `RubyLLM.count_tokens` and `chat.count_tokens` use supported counting endpoints for conversation input. The counting API includes supported history, instructions, tools, schema, thinking, and attachments; hosted tools, raw provider options, compaction, and request-hook changes are excluded. By @crmne. ([12779995], [18d3622e])
- **Action Text embedded attachments reach the model with the surrounding text.** Active Storage attachables in rich text are extracted into the normal attachment flow. By @crmne. (#760)
- **OpenAI Responses accepts native Office document inputs.** Word, PowerPoint, Excel, and other supported document types use file inputs instead of being rejected for not being PDFs. By @crmne; thanks @aviflombaum. (#826, [997f8fb7])
- **Upload once and reuse a provider file.** `RubyLLM.upload`, `UploadedFile.find`, `RubyLLM.find_file`, and `RubyLLM.download` provide typed metadata and downloads, with shared `uri:`, `content_type:`, and expiry options where supported. The adapters cover provider Files APIs, S3, GCS, Cohere datasets, and ElevenLabs media assets, each with its own restrictions. By @crmne; thanks @toddkummer. ([fa47b775], [18d3622e], #764)
- **Large chat attachments can use provider storage automatically.** Attachments are prepared when the request is sent, uploads are reused per provider, and expired uploads are replaced. That keeps local history usable across subsequent requests and model/provider changes. By @crmne; thanks @altxtech. ([a5f3dbdd], [9ca2c002], #426, #517)
- **Run a hosted research task and recover it by job ID.** `RubyLLM.research` waits for a report; `research_later` returns a `ResearchJob` for finding, polling, and cancellation. The Vertex AI Deep Research integration supports remote MCP and preserves reported citations and usage. Agent identity is separate from model identity, and chats continue to use application-owned history. By @crmne. ([18d3622e])
- **Standalone operations carry configuration and instrumentation consistently.** Explicit keywords, `provider_options:`, per-call metadata, and `RubyLLM.context` apply to media, embeddings, moderation, files, research, and related operations without constructing a chat. By @crmne; thanks @rainerborene and @goianiense. ([1bc6fc03], [18d3622e], #807, #825)

### Batches, accounting, and Rails

- **Submit staged chats to provider batch APIs.** `RubyLLM.batch` returns a `Batch` with an ID, normalized status, refresh/cancel operations where supported, ordered results, and per-request statuses. `Batch.find` lets another process collect the answers. Tool turns can be run locally and submitted again in another batch. By @crmne; thanks @marckohlbrugge, @thomaswitt, @toddkummer and @khasinski. ([9d7d63e8], [18d3622e], #1, #342)
- **Batch embeddings through the same interface.** `embed_later` stages text `EmbeddingRequest` values. Batch collection restores scalar, one-element-array, and multi-input shapes, preserves failed positions, and correlates reordered provider results after reloading. Provider restrictions and storage requirements are documented in the [batch guide](https://rubyllm.com/batches/). By @crmne. ([7a2833bf], [18d3622e])
- **Usage follows each provider attempt.** Response and chat totals include reported usage from retries, fallbacks, cancelled work, and attempts without a completed message. Unknown usage or pricing stays `nil`; a request known never to have reached the provider can record zero. By @crmne. ([2aaddf96], [b69f545c])
- **Generation and accounting share `Tokens` and `Cost`.** Read `input`, `output`, `thinking`, `cache_read`, and `cache_write` through normalized readers. `cost.total` prefers provider-reported amounts, including OpenRouter and xAI prices, while unknown prices stay unknown and a real zero price remains zero. By @crmne. ([05364428], [959f42cf])
- **Historical Rails costs stay historical.** The usage ledger stores attempts and their completion-time costs separately from messages. Later registry pricing changes do not rewrite those amounts. Batch costs use batch rates or a reported aggregate invoice and remain unknown until processing ends. By @crmne. ([2b6a981f], [18d3622e])
- **Name a workflow and its steps without changing how you write Ruby.** `RubyLLM.workflow` and `workflow.step` attach workflow, parent, step, and metadata identifiers to instrumentation. Rails uses `ActiveSupport::Notifications`; plain Ruby uses the configured instrumenter. Ordinary Ruby handles branching, loops, and concurrency. By @crmne. ([8734d81d], [101d2513])
- **Your application owns two conversation models; RubyLLM owns the supporting tables.** `acts_as_chat` and `acts_as_message` use your chats and messages alongside `ruby_llm_models`, `ruby_llm_tool_calls`, `ruby_llm_usages`, and `ruby_llm_batches`. Applications no longer need supporting `Model`, `ToolCall`, or `Batch` classes. By @crmne. ([959f42cf], [009015ea])
- **Persisted agents expose the same conversation controls.** `Agent.create!` and `Agent.find` return the application's configured chat record with tools, instructions, and options reapplied. Approvals, cancellation, loop progress, citations, thinking/native content, cache boundaries, compaction, attachments, and usage survive reloads. By @crmne. ([6dd2637a], [18d3622e])
- **Rails can resume work with Active Job and Hotwire.** Generated and documented flows stage the user message immediately, stream assistant output, stop from another request, and park for approval. Tools must tolerate retries if a process stops before saving its result. By @crmne. ([06990d66], [4683f905])
- **The 1.16 upgrade is split into preparation, backfill, finish, and later cleanup.** The install and upgrade generators evolve together. Backfill handles custom/namespaced models, UUID keys, duplicate tool-call IDs, raw content, existing usage, and model references, with checks before destructive cleanup. By @crmne. ([3b7ebd01], [009015ea])
- **Optional copy mode provides a controlled route back to 1.16.** `--mode copy` retains legacy tables and generates compatibility guards for both application builds. Conversations changed by 2.0 stay stored but hidden during rollback, then return on resume after reconciling intervening 1.16 writes. Rename remains the default. By @crmne. ([009015ea], [47b35420])
- **The model registry has one storage API in Ruby and Rails.** `RubyLLM.models.refresh` downloads the published registry, merges configured providers, and writes the selected store. Plain Ruby uses a per-user cache file; Rails configures its database store. Provider-gem catalogs act as registered read-only fallbacks, with the main registry winning conflicts. By @crmne. ([091b16a3], [fe7f9d00])

## Fixed

### Improvements from release-candidate testing

- **Disabling tools works on OpenRouter's Chat Completions route.** Disabled function definitions are omitted from the request to avoid empty completions, while the chat keeps its tools for later use.

- **Thinking history survives follow-up turns without crossing providers.** Anthropic and Bedrock retain native thinking blocks, including streamed and persisted messages (#896). Switching providers drops incompatible thinking content from the outgoing request. By @crmne and @kieranklaassen. (#935)
- **Persisted attachments avoid repeated database queries.** Preload attachment blobs, Action Text content, and embedded rich-text blobs when building requests. By @MatheusRich and @yorzi. (#909, #932, #939)
- **Copy upgrades support online preparation and backfill on all three database adapters.** Prepared 1.16 processes can continue serving on PostgreSQL, MySQL, and SQLite until the coordinated final switch. Compatibility guards preserve Active Record autosave and load after RubyLLM configuration. By @crmne.
- **Copy-upgrade finish can explicitly discard incomplete legacy tool calls.** `--discard-incomplete-tool-calls` preserves calls with results and protected 2.0 conversations. Discarded calls are not restored by rollback or resume; read the [upgrade guide](https://rubyllm.com/upgrading/#incomplete-tool-calls) before choosing this option. By @crmne.
- **Generated migrations honor configured primary-key types and acronym inflections.** New installs and upgrade cleanup also remove the redundant standalone message-role index while preserving composite indexes. Copy migrations omit rename-only helpers. By @crmne. (#910)
- **Prompt caching combines automatic placement with explicit boundaries.** `with_caching` stays enabled alongside `cache_until_here`; supported OpenAI-compatible models accept `mode: "explicit"` for explicit-only caching. By @crmne. (#930)
- **Pricing stays scoped to the provider that handled the request.** Overlapping model IDs resolve correctly for streaming and Rails reloads; existing stored costs stay unchanged. By @crmne. (#923)
- **Agent inheritance respects a child's own instructions and conventional prompt.** By @crmne. (#915)
- **Provider results keep their correct input positions.** Invalid reranking indices and duplicate Gemini embedding batch positions raise instead of attaching results to the wrong inputs. Empty Gemini Interactions tool arguments are accepted. By @crmne. (#911, #917, #918)
- **Mistral OCR receives text attachments as data URIs.** By @alannascimento1. (#919)
- **Bedrock video output-prefix normalization avoids excessive regex backtracking.** By @crmne.
- **Instrumentation uses the provider instance's name.** Delegated providers report the correct identity. By @toddkummer. (#926)
- **Generated provider gems resolve their RubyLLM dependency during prereleases.** The RC1 Bundler failure is fixed. By @crmne.
- **The Rails upload example validates uploaded files before passing them to `with:`.** Apps that copied the older example must update that application code; upgrading the gem alone does not change it. String paths and URLs remain supported. By @crmne.
- **The bundled catalog and aliases have been refreshed, and 2.0 is the default documentation site.** The homepage includes mobile fixes; [1.x documentation](https://rubyllm.com/v1/) remains available. By @crmne.

### Provider requests, streaming, and results

- **Stream retries cannot duplicate output already delivered.** Retry is allowed only before any output reaches the caller. Errors, refusals, incomplete Responses events, and Bedrock exception frames retain their RubyLLM error type instead of disappearing or raising parser errors. Job-creation requests are not blindly retried. By @crmne. ([c8931fb2], [993c51ea])
- **Streamed text, tool calls, and provider pauses assemble correctly.** Tool-call keys remain stable, mixed text/tool output is preserved, Anthropic block state resets between `pause_turn` segments, and final-only citations and usage survive assembly. By @crmne. ([504fca4f], [18d3622e])
- **Gemini keeps inline images in mixed text-and-image answers.** Attachments no longer disappear because the same response also contains text. By @crmne; thanks @bubiche. ([0f0ba2d1], #684)
- **Claude and OpenRouter thinking context survives follow-up turns.** Omitted Bedrock thinking blocks, native Claude thinking/signatures, and OpenRouter `reasoning_details` are replayed without reconstructing or dropping the provider's content. Streamed thinking-token counts and output-budget limits are handled correctly. By @crmne; thanks @mvysny and @justwiebe. ([dc97623f], [2d5caa11], #895, #897, #852, #868)
- **Structured-output schemas keep their intended meaning.** Gemini receives JSON Schema and its own batch dialect, type unions are normalized where needed, and strict-mode rules no longer make optional properties silently required. Malformed tool-call JSON raises `ToolCallParseError`. By @crmne; thanks @cbillen. ([a6a4bb88], [567087d3], #894)
- **Provider failures produce useful RubyLLM errors.** Empty completion responses, string/array/nested error bodies, context-length failures, unsupported operations, and missing optional authentication dependencies are handled explicitly. Context-size overflow spellings are recognized across additional providers. By @crmne; thanks @adrianthedev, @SiteupAgencia, @fidalgo, @orthodoX, @boolean and @lucasmo. ([4e769cd7], [3b3937cd], #751, #862, #733, #722, #871, #829)
- **Explicit request settings reach the provider.** Temperature is no longer rewritten or silently removed by model-name guesses. Image size, transcription options, false-valued settings, and mixed-key server-tool hashes survive normalization; impossible Bedrock thinking budgets raise before sending. By @crmne; thanks @adamcooper. ([a3f8b2a6], [de8348ee], #719)
- **TLS streaming waits on the underlying socket.** This fixes the wait behavior for TLS-backed WebSocket connections. Proxy and timeout settings also apply to basic connections, and Bedrock signing sorts query values correctly. By @crmne. ([92884ae0], [c781438a])
- **Configuration inspection redacts credentials, and cached uploads stay scoped to credentials.** Plain `inspect` no longer prints API keys, and an upload cached for one tenant is not reused for another tenant with different credentials. By @crmne. ([d17f2c2b])
- **Name and capability parsing avoid excessive regexp backtracking.** Tool/agent name normalization and Mistral Voxtral model matching remain efficient on long inputs, including Ruby 3.1. By @crmne. ([9d75b033], [dd3c8481])
- **Attachments preserve their bytes and source.** IO attachments are read completely, renamed attachments rebuild from the source, URL schemes are recognized case-insensitively, and file timestamps accept numeric strings. Generated-file downloads use the correct provider endpoints and avoid forwarding credentials to unrelated signed media hosts. By @crmne; thanks @andreaslillebo and @skovy. ([462f0bb0], [18d3622e], #762, #835)

### Conversations, Rails, accounting, and catalogs

- **Instructions do not duplicate on replay or disappear behind stale records.** Persisted instructions update in place, `to_llm` is memoized and synchronized, full message attributes survive reconstruction, and failed transport attempts remove empty assistant placeholders. By @crmne. ([142ff20a], [62d6b794])
- **Tool decisions and configuration survive the loop correctly.** Dynamic Active Record tool registration works, denying a call is respected even when the tool has no approval requirement, agent subclasses inherit server tools, and Chat/Agent/record delegate lists stay aligned. By @crmne; thanks @ebeigarts. ([2c446372], [ac87f5ab], #689)
- **Batch collection delivers each result once.** Empty batches return no fabricated messages, nested provider errors retain their failed slots, stored protocol names can be resolved after reload, and array-shaped embedding results survive reordered output. By @crmne. ([74e0cdb6], [18d3622e])
- **Cost calculation keeps valid model and usage information.** Unregistered response model IDs fall back to the requested model for pricing, `cost(model:)` can override recorded usage pricing, and streamed server-tool counters are retained. Embedding, transcription, and speech costs can use the applicable text-pricing fallback. By @crmne; thanks @smathieu. ([6a92f147], [d17f2c2b], #904)
- **Registry refresh no longer silently shrinks the catalog.** Paginated listings are read completely, skipped or failed providers retain their models, unlisted models are marked, and refresh failures are reported. Published-registry download failure leaves the existing registry intact. By @crmne. ([d288e5be], [fe7f9d00])
- **Model metadata comes from actual catalogs and models.dev.** Anthropic context limits, OpenAI shutdown dates, OpenRouter cache prices and knowledge cutoffs, Azure fields, Mistral capabilities, Ollama model details, Bedrock profiles, and tool-control capabilities replace unsupported guesses. By @crmne; thanks @stirkac. ([83fe2cba], [919a36af], #864)
- **Concurrent Rails model creation reuses the row another process inserted.** An empty registry store is populated before the first chat is saved, and the model-loading task loads Active Record before using it. By @crmne. ([42d74419], [40cb2925])
- **Generated Rails files follow the application's naming and routing.** Schema filenames respect Zeitwerk, upgrade migration classes handle acronym inflections, custom message/model associations resolve correctly, and chat UI routes, controllers, and tool partials use conventional names and stable ordering. By @crmne; thanks @chloerei and @toluola. ([3ea57a31], [0b7f7792], #877, #879, #880)
- **Upgrade preparation can be retried safely.** The generator rejects already-upgraded schemas, preserves required model references, and makes preparation idempotent. Usage rows without a real model stop the upgrade so they can be corrected from original requests. By @crmne. ([4282b563], [fe8419a4])
- **Debug logging honors false settings.** Falsy `RUBYLLM_DEBUG` and `RUBYLLM_STREAM_DEBUG` values turn logging off, and console inspection shows concise readers instead of large internal object graphs. By @crmne. ([ad25123f], [97372300])

- **Bedrock application inference profile ARNs work as model IDs.** By @mattwebbio and @crmne. (#803)
- **Bedrock responses keep the requested model when the provider omits its ID.** By @hschne. (#817)
- **Bedrock streaming no longer drops every chunk when the Faraday environment is absent.** By @chen-anders. (#813)
- **Bedrock input usage no longer subtracts cache tokens twice.** By @jmangel and @crmne. (#832, #828)
- **Bedrock thinking effort maps correctly for Claude models.** By @Edilbek and @crmne; thanks @justwiebe. (#855, #851)
- **Bedrock structured-output support is no longer guessed from a model version number.** By @shawnhutchison. (#899)
- **Azure streaming no longer latches onto an empty model ID and loses cost information.** By @bdegomme and @crmne. (#830)
- **Responses function tools preserve optional parameters.** Strict validation is opt-in. By @bdegomme and @crmne. (#844, #843)
- **Reasoning summaries keep the separators between their parts.** By @hiasinho and @crmne. (#866, #865)
- **DeepSeek reasoning conversations keep the reasoning context required for later turns.** By @iuhoay and @crmne. (#749)
- **Anthropic streams are requested without compression.** This avoids buffering streamed output behind compression. By @xymbol and @crmne; thanks @dinsley. (#771)
- **Parallel Anthropic tool results are grouped into the user message the API expects.** By @adamshen. (#853)
- **Anthropic input-plus-output context overflows raise ContextLengthExceededError.** By @frostmark. (#907, #906)
- **Non-object JSON error bodies no longer crash the streaming error parser.** By @Niraj22 and @crmne; thanks @mvysny. (#840, #837)
- **A provider response without a completion raises a clear error.** By @jonthedecepticon; thanks @lucasmo. (#849, #847)
- **Automatic retries honor provider rate-limit headers.** By @Niraj22 and @crmne. (#850)
- **Long-context cost calculation uses the correct pricing tier.** By @Edilbek; thanks @victorface2. (#859, #854)
- **Converting persisted chats avoids N+1 message-association queries.** By @matthewbjones. (#717)
- **Generated tool-call partials no longer produce duplicate DOM IDs.** By @edudepetris. (#802, #804)
- **Agents and persisted chats delegate request hooks, token counting, and rendering consistently.** By @toluola; thanks @danielefrisanco. (#884, #872, #883)
- **Agent request hooks also reach the wrapped chat.** By Sai Asish Y. ([48a7e751])
- **Marcel 2 can be used with Rails.** The supported dependency range now accepts Marcel 1 and 2. By @FrancescoK. (#905)
- **Ruby 4 no longer warns about redefining the regexp-timeout setter.** By @dominion525 and @crmne. (#721)

## Changed in 2.0

These changes need attention when upgrading from 1.x. The [upgrade guide](https://rubyllm.com/upgrading/) contains the full replacement table, examples, and Rails procedure.

- **Message content is text; parsed output and attachments have their own readers.** `response.content` returns the JSON string for structured output; use `response.parsed` for the Hash. `RubyLLM::Content` and raw content blocks are removed. `before_request` is the hook for custom wire payloads. Message content is read-only. By @crmne; thanks @lirenzhu and @afurm. ([b000774e], [74aa1d85], #707, #718)
- **Token and cost names are consistent.** Replace direct message token readers with `message.tokens.input`/`output`/`thinking`/`cache_read`/`cache_write`. `Tokens.new` replaces `Tokens.build`. `Cost` exposes amounts; model and token information stay on the result. Old cache-price and mutable pricing-hash readers are replaced by named readers. By @crmne. ([b44bb93c], [959f42cf])
- **Tools use keyword calls and full DSL names.** `tool.call(city: "Berlin")` replaces a positional argument Hash. Use `description`, `parameter`, `parameters`, `parameters_schema`, and `provider_options` instead of the old abbreviations and readers. `with_tools` replaces `with_tool`; selection/concurrency options move to `with_tool_options`. The tool `provider_options` macro requires a Hash and rejects `nil`; `parameters` declares a schema rather than acting as a public reader. By @crmne. ([b44bb93c], [38e5a597])
- **The caller controls when tool execution stops.** `Tool::Halt` and `halt` are removed; use the loop methods or approval flow. `Message#tool_results` now returns the messages answering an assistant's tool calls; read a tool-result message's text through `content`. By @crmne. ([bfbb2d52], [cd092760])
- **The schema DSL lives in Schematist.** Replace `RubyLLM::Schema` with `Schematist::Schema`. Inline tool and agent schema blocks retain the DSL. Agent `schema do ... end` always defines a schema; pass a lambda for a runtime-selected schema. Schematist is installed and loaded with RubyLLM. By @crmne. ([52c4c44d], [e834a84f], #869)
- **Instructions replace by default and callbacks are additive.** Use `append: true` to add instructions. `before_message`, `after_message`, `before_tool_call`, and `after_tool_result` replace the old `on_*` names and run alongside persistence callbacks. Bare `Agent.instructions` reads configuration; named agents discover optional conventional prompts automatically. By @crmne. ([d2d61e16], [959f42cf])
- **Setters and switches follow a predictable shape.** Value setters accept `nil` to reset and return the chat. Thinking, citations, caching, and compaction accept no argument or `true` to enable, options to configure, and `false` to disable; those four switches reject `nil`. Agent macros and Rails delegates match. By @crmne. ([dc18caed], [d7aa6cec])
- **Provider-specific options have one name.** Replace `with_params`, `params:`, and tool `with_params` with `with_provider_options`/`provider_options:`. Values stay in the provider's own request shape. Shared concepts such as OCR `pages:`, upload `uri:`/`content_type:`, and embedding `task_type:`/`title:` remain keywords. Instrumentation uses `:provider_options` too. By @crmne. ([9f62b332], [fdf42b5f])
- **RubyLLM enums are Symbols.** `finish_reason` is normalized to `:stop`, `:max_tokens`, `:tool_calls`, or `:content_filter`; model types, usage/batch statuses, and framework thinking efforts also use Symbols. Provider IDs and provider-owned values remain Strings. By @crmne. ([9737d1a0], [5452cd3d])
- **Model lookup and pricing have one public interface.** `RubyLLM::Model` replaces `Model::Info`; use `name`, `max_output_tokens`, `price(:input)`, and `supports?(:vision)` instead of legacy readers/predicates. Pass `provider:` as a keyword and `assume_model_exists:` for explicit unknown-model use. Result `model` replaces `model_id`. By @crmne. ([7b07bf92], [959f42cf])
- **Registry refresh and storage use plain method names.** `refresh`, `load_from_json`, and `load_from_store` replace bang/legacy variants. `model_registry_store` and `model_registry_file` replace old source classes and application registry models. A custom store implements `read` and optionally `write`. By @crmne. ([091b16a3], [fe7f9d00])
- **Errors take the message first.** Use `Error.new("message", response: response)`. `UnsupportedAttachmentError` is a RubyLLM error, and malformed tool arguments raise `ToolCallParseError`. By @crmne. ([567087d3], [959f42cf])
- **Several standalone result and option names are clearer.** Transcription uses `format:` instead of `response_format:`. Moderation exposes typed `results` and `flagged_categories`. Image usage is read through `tokens` and `cost`. Local/inline attachments expose bytes through `content`; generated/downloaded results provide `save` and `to_blob`. By @crmne. ([b121fa8b], [959f42cf])
- **OpenAI-specific configuration must match the selected protocol.** Responses is now the default; existing Chat Completions-only raw options need migration or `protocol: :chat_completions`. Function tools default to `strict: false` to preserve optional parameters, with explicit strict configuration available. Provider implementation modules move to `RubyLLM::Protocols`. By @crmne and @bdegomme. ([0875ce2d], [d398354d])
- **Rails uses the association-based integration and framework-owned supporting tables.** The legacy `acts_as` path and `use_new_acts_as` setting are retired. `ask_later` replaces `create_user_message`; plain transcript replacement replaces `reset_messages!`. Install and upgrade generators produce the new schema and supporting records. By @crmne. ([b47d0f45], [009015ea])

### Rails migration choices

| Mode | What it does | Returning to 1.16 |
| --- | --- | --- |
| Rename, the default | Reuses existing model/tool-call tables under RubyLLM's ownership. | Restore the pre-upgrade database and matching application build. |
| Copy, optional | Retains legacy tables while 2.0 uses its supporting tables, with compatibility code in both builds. | Follow the coordinated rollback procedure before final cleanup; 2.0-changed conversations remain stored for resumption. |

Rename mode requires affected activity to stay paused through preparation, backfill, and finish. In copy mode, prepared 1.16 processes can keep serving during preparation and backfill on PostgreSQL, MySQL, and SQLite, with a controlled pause for the final switch. Cleanup belongs in a later deployment. Copy mode needs additional storage and reconciliation work; it selects one active version per database and does not provide simultaneous 1.16/2.0 traffic splitting. Rehearse with a database copy and your application's own schema and write paths. By @crmne. ([009015ea], [47b35420])

## Documentation and development

- **The guides now cover the complete 2.0 API.** New and expanded guides cover approvals, server tools/MCP, citations, caching, tokenization, video, speech, transcription, OCR, files, reranking, hosted research, batches, usage, instrumentation, durable agents, memory, RAG, generators, and upgrading. Examples connect those operations with ordinary Ruby and Rails code. By @crmne. ([691ef5c9], [4683f905])
- **The website has versioned documentation and a new theme.** A refreshed homepage, capability-first navigation, provider logos, updated company/sponsor presentation, API links, and 2.0 guides at the site root and archived 1.x guides at `/v1/` make the expanded framework easier to explore. Structured metadata is escaped correctly and the model reference links to its generated registry. By @crmne. ([67a1d2a0], [4683f905])
- **The public API has RDoc, including generated delegates and Rails macros.** The module overview covers standalone operations as well as chats. By @crmne. ([b44bb93c], [e0bcf1d4])
- **The gem ships a RubyLLM agent skill and an executable.** The skill teaches coding assistants the current public API, and `ruby_llm provider-gem` generates a standalone integration with configuration, catalog tasks, specs, and CI. Generator tooling loads explicitly outside the runtime tree. By @crmne. ([cd61467b], [009015ea])
- **Architecture checks enforce the framework's boundaries.** Archspec checks provider/domain separation, complete protocol contracts, registry ownership, public naming, Ruby/Rails isolation, and matching Agent/Chat APIs. Shared transport, streaming, accounting, registry, files, and support internals now live with their owning namespaces. By @crmne. ([f1cf3b0e], [18d3622e])
- **Tests distinguish unit behavior from provider recordings.** Live examples are tagged `:live`; shared model-selection helpers use actual catalog models. Failed live examples remove their cassette for re-recording. HTTP and WebSocket fixtures have broader sanitization, portability, and provider coverage. By @crmne; thanks @cgmoore120. ([a517b71a], [71a69a07], #815)
- **CI exercises the Rails upgrade against real databases and the released 1.16 gem.** The release matrix covers 19 supported combinations across Ruby 3.1 through 4.0, JRuby 10.0.2.0, and Rails 7.1 through 8.1. Separate PostgreSQL 17 and MySQL 8.4 checks exercise migrations; latest Ruby/Rails runs the generator suite and rollback/resume compatibility tests. By @crmne. ([009015ea], [ec710421])
- **Gem publication starts with a published GitHub release.** The workflow verifies the immutable tag, gem version, prerelease flag, and main-branch ancestry, then runs security, lint, and tests before publishing the same built gem to RubyGems and GitHub Packages. It retains the 24-hour cassette-freshness gate. By @crmne. ([e68aefd6], [ec710421])
- **The package includes what an installed user needs.** The executable, agent skill, generator templates, RDoc options, model catalogs, and operation assets ship in the gem. JSON stays below version 3 for Faraday/Rails compatibility; Schematist replaces `ruby_llm-schema`. By @crmne. ([73c02883], [e7a15427])
- **Contribution instructions describe the actual architecture and review process.** `AGENTS.md`, the contributing skill, provider scaffolding guidance, and advisory Copilot review instructions cover API consistency, model evidence, tool testing, docs, and release practices. By @crmne. ([d112146a], [9b30f939])

- **Generator specs were updated for the newer Rails integration defaults.** By @xymbol. (#801)
- **Generator specs ignore user-level Rails configuration.** By @andyw8 and @crmne. (#892)
- **Scaffold specs resolve their temporary directory consistently on macOS.** By @toluola. (#902, #901)
- **The development RDoc dependency remains compatible with JRuby.** By @xymbol. (#831)
- **The coverage dependency no longer breaks CI.** By @jonthedecepticon; thanks @Niraj22. (#846, #842)
- **The ecosystem guide includes RubyLLM::TopSecret.** By @stevepolitodesign and @crmne. (#731)
- **The ecosystem guide includes RubyLLM::Test.** By @toddkummer and @crmne. (#752)
- **The ecosystem guide includes RubyLLM::Contract.** By @justi and @crmne. (#808)
- **The ecosystem guide includes RubyLLM::Instructor, Registry, Tokenizer, and Turbovec.** By @washu and @crmne. (#812)

## Thanks

Additional code and fixes during release-candidate testing by @alannascimento1, @MatheusRich, @yorzi, @kieranklaassen, @toddkummer, and @crmne.

Code and documentation by @crmne, @adamshen, @andyw8, @bdegomme, @chen-anders, @dominion525, @Edilbek, @edudepetris, @FrancescoK, @frostmark, @hiasinho, @hschne, @iuhoay, @jmangel, @jonthedecepticon, @justi, @kryzhovnik, @matthewbjones, @mattwebbio, @Niraj22, @shawnhutchison, @stevepolitodesign, @toddkummer, @toluola, @washu and @xymbol, and Sai Asish Y.

First contributions during the RC1 development cycle from @adamshen, @andyw8, @bdegomme, @chen-anders, @dominion525, @Edilbek, @edudepetris, @FrancescoK, @frostmark, @hschne, @iuhoay, @jmangel, @jonthedecepticon, @justi, @matthewbjones, @mattwebbio, @Niraj22, @shawnhutchison, @stevepolitodesign, @toddkummer, @toluola and @washu.

Thanks also to @adamcooper, @adrianthedev, @afurm, @AlexanderMamrenko, @altxtech, @andreaslillebo, @andrew-woblavobla, @arunkumarry, @aviflombaum, @boolean, @bubiche, @cbillen, @cgmoore120, @chloerei, @crhbjk2zn2, @dalton-cole, @danieldenis01, @danielefrisanco, @db0sch, @decaffeinatedio, @derikolsson, @dinsley, @dlackty, @ebeigarts, @fidalgo, @fvaleye, @goianiense, @grgr, @IvanLysikov, @jbourassa, @jondavidschober, @jordan-brough, @jscheid, @juanmanuelramallo, @justwiebe, @khasinski, @kieranklaassen, @lirenzhu, @losingle, @lucasmo, @marckohlbrugge, @marksweston, @martinemde, @mastraus, @mnort9, @mtoneil, @mvysny, @myxoh, @nbelzer, @Ndunge-Makau, @orthodoX, @palladius, @patvice, @radeno, @rainerborene, @ramontayag, @salidux, @sh1nj1, @SiteupAgencia, @skovy, @smathieu, @stirkac, @thomaswitt, @tpaulshippy, @trevorturk, @victorface2 and @zavan for reports, reproductions, reviews, design discussions, and proposals tied to the changes above. Several proposals were incorporated or reworked directly on main; their authors are credited with the relevant feature rather than counted as merged PRs.

**Full changelog**: https://github.com/crmne/ruby_llm/compare/1.16.0...v2.0.0

[a5dbcda9]: https://github.com/crmne/ruby_llm/commit/a5dbcda9c62fac5466b703e3a659a5fe7611614f
[71a69a07]: https://github.com/crmne/ruby_llm/commit/71a69a073ee19ea475a14ec7cf35de71a85d5537
[d398354d]: https://github.com/crmne/ruby_llm/commit/d398354da493570b0509afe737e12b29e65907f4
[3400654b]: https://github.com/crmne/ruby_llm/commit/3400654bac763d684d7be003b742ed44f300bb89
[4683f905]: https://github.com/crmne/ruby_llm/commit/4683f9059a81660edd7c2c1f31a95e387e882960
[6051a544]: https://github.com/crmne/ruby_llm/commit/6051a544a51e30b2bbeb8b3cf8deaf82a5c18891
[0875ce2d]: https://github.com/crmne/ruby_llm/commit/0875ce2dfeae9d28a3a37f8062ae93c227a597ec
[18d3622e]: https://github.com/crmne/ruby_llm/commit/18d3622e917b02d7912b906e66ae9c9d585dfd44
[f6c0e660]: https://github.com/crmne/ruby_llm/commit/f6c0e6606cdb019e4c30af788e4f79cbfb674893
[fe1f0c5b]: https://github.com/crmne/ruby_llm/commit/fe1f0c5bc33e61bec52aec32a06d78103bbfd1bf
[239dbef5]: https://github.com/crmne/ruby_llm/commit/239dbef5fc710a5e2cb07816d6979e094cbc361c
[44f3cc09]: https://github.com/crmne/ruby_llm/commit/44f3cc09f1412934146451bf6c6bb184ed8786ea
[8fcd3802]: https://github.com/crmne/ruby_llm/commit/8fcd380245089f44f5406ca711def8fde506b498
[28a8ff2b]: https://github.com/crmne/ruby_llm/commit/28a8ff2b8e7c9a6c7dce8be76a8fb37ab769a399
[4993bd47]: https://github.com/crmne/ruby_llm/commit/4993bd4775175f486fddb6779709437383957d5e
[b6575414]: https://github.com/crmne/ruby_llm/commit/b6575414d95c09aad9d23e884dbfb8546dfad021
[390a9a42]: https://github.com/crmne/ruby_llm/commit/390a9a42a559ef2f3235f0153698846aa7165957
[09546082]: https://github.com/crmne/ruby_llm/commit/095460827aebc99f69704f51b5185f4c01ae2f3b
[757129c6]: https://github.com/crmne/ruby_llm/commit/757129c60e4817ff622fb466b2e3bf085a1c9104
[16b08a15]: https://github.com/crmne/ruby_llm/commit/16b08a153dcaf0ae043c84ad9653605cbdbcabec
[b0aa9a9b]: https://github.com/crmne/ruby_llm/commit/b0aa9a9b37f1d158c30672f4abed42d9ec8f0ebc
[c460d77b]: https://github.com/crmne/ruby_llm/commit/c460d77bfc4c4937847e84f2ddda0abf5675d95d
[bfbb2d52]: https://github.com/crmne/ruby_llm/commit/bfbb2d52399cfef1845cdd5f59a50a6d888e6361
[ac87f5ab]: https://github.com/crmne/ruby_llm/commit/ac87f5ab6f2b87674d4e307ddec4791e14abb8e8
[503d5284]: https://github.com/crmne/ruby_llm/commit/503d528434ad1c256618beeb7fb30107fbe82177
[99a30606]: https://github.com/crmne/ruby_llm/commit/99a3060649c91acb1966c712d5212e6c9ddc7a5c
[47a9dfb6]: https://github.com/crmne/ruby_llm/commit/47a9dfb65b825ca1fd69b3f2795fb781b5c08eb3
[b6dd4ca8]: https://github.com/crmne/ruby_llm/commit/b6dd4ca84f51ab68f32c6a3656785399a9ed8495
[c4f9c05b]: https://github.com/crmne/ruby_llm/commit/c4f9c05b0780a97075bd9587cf7940565335e5da
[ea16d66c]: https://github.com/crmne/ruby_llm/commit/ea16d66ca2ede16f5a7b5d46b4adb54646ae8f79
[3c9f4294]: https://github.com/crmne/ruby_llm/commit/3c9f429479d248d674a64c95f58788ec8289dd7b
[644c1800]: https://github.com/crmne/ruby_llm/commit/644c180094fea2bc98e25a402791d0fa85621d67
[fc724a4e]: https://github.com/crmne/ruby_llm/commit/fc724a4e9e0959a9ebaf4a0b341ba0bca8700fa1
[38af607f]: https://github.com/crmne/ruby_llm/commit/38af607f423e079711d5d7db9b1cefe7eead85f8
[959f42cf]: https://github.com/crmne/ruby_llm/commit/959f42cf9f71627945d171861cb797c458b25526
[38e5a597]: https://github.com/crmne/ruby_llm/commit/38e5a597ad10a84704618319cf776c0c1c4aa670
[f62fe516]: https://github.com/crmne/ruby_llm/commit/f62fe51674f38892287a0cf43830becfae909cee
[9359d160]: https://github.com/crmne/ruby_llm/commit/9359d1603f87961c578b03e09111ac4a27ef8266
[f835bb44]: https://github.com/crmne/ruby_llm/commit/f835bb4498d86f8e999fc4f589fe108e89b702fb
[5deb83a5]: https://github.com/crmne/ruby_llm/commit/5deb83a5621047a6047ebf5fe12d50538f536d3e
[446b57ce]: https://github.com/crmne/ruby_llm/commit/446b57ce55938b5abf625c6676441b1ad7b51742
[28a3669d]: https://github.com/crmne/ruby_llm/commit/28a3669d83f1ba875df6b0583c9d1495ed836b75
[3096c9ef]: https://github.com/crmne/ruby_llm/commit/3096c9efe6682367332dafbc0e481e1ba277b8be
[9d7d63e8]: https://github.com/crmne/ruby_llm/commit/9d7d63e8f0a18b9714984ee27c5c60440e1cbaf9
[d7aa6cec]: https://github.com/crmne/ruby_llm/commit/d7aa6cec70bf7d837b814a20403b32910dba08eb
[9737d1a0]: https://github.com/crmne/ruby_llm/commit/9737d1a09f517462be7506dc3e14b71af1476a42
[e0bcf1d4]: https://github.com/crmne/ruby_llm/commit/e0bcf1d4024cc8f630e492f62c1fe2d48842ca22
[471fc27c]: https://github.com/crmne/ruby_llm/commit/471fc27cd6e31d7001ad194a03694191eb239829
[08035557]: https://github.com/crmne/ruby_llm/commit/08035557e349081e79e5457127bb74a5f4e73552
[5ade6e24]: https://github.com/crmne/ruby_llm/commit/5ade6e2479231c8abfc5a720ebad6c61051bb47a
[68fef9e7]: https://github.com/crmne/ruby_llm/commit/68fef9e7d1369fcd99da2478479d9552e1fec2ff
[b81b1262]: https://github.com/crmne/ruby_llm/commit/b81b126283ef884645c5db4da944c244168b1ad7
[5f8ed0e7]: https://github.com/crmne/ruby_llm/commit/5f8ed0e72380ffa8352658f4503054cb1efe6ded
[8f2127e4]: https://github.com/crmne/ruby_llm/commit/8f2127e43899b9fd3a37feb684a22ce225355111
[4fa3bb12]: https://github.com/crmne/ruby_llm/commit/4fa3bb12bc73f1da39be1b8e8ca5b0440ecd53ca
[efbe8faf]: https://github.com/crmne/ruby_llm/commit/efbe8faf4b8046a5c2d3b93ddad78b7658348dab
[58ace224]: https://github.com/crmne/ruby_llm/commit/58ace224c3cd948e239d7617517d39e611eeb22a
[3998b053]: https://github.com/crmne/ruby_llm/commit/3998b053621b5b7b4ac531bd7aec68074e7c9acb
[12779995]: https://github.com/crmne/ruby_llm/commit/12779995f42b8c368583a3ce77231d243f321767
[997f8fb7]: https://github.com/crmne/ruby_llm/commit/997f8fb797aa85823c716e952b4121b99ca95d92
[fa47b775]: https://github.com/crmne/ruby_llm/commit/fa47b775a1372f8ab1f66f98ec2f9ef1ad214f04
[a5f3dbdd]: https://github.com/crmne/ruby_llm/commit/a5f3dbddb2fef6e7e5946343f571867291b3e067
[9ca2c002]: https://github.com/crmne/ruby_llm/commit/9ca2c0020e1443b2221347d10ef9b27c32a62114
[1bc6fc03]: https://github.com/crmne/ruby_llm/commit/1bc6fc03f3fab036dad1a9a33dffe4a75c3e6d67
[7a2833bf]: https://github.com/crmne/ruby_llm/commit/7a2833bf0f8882a2e371b5d1eb6dd51760bb6057
[2aaddf96]: https://github.com/crmne/ruby_llm/commit/2aaddf96f532727abc3f24d94dfbc75f6e3b6906
[b69f545c]: https://github.com/crmne/ruby_llm/commit/b69f545cd934644425000aac1b7d9f07e3ba4bfc
[05364428]: https://github.com/crmne/ruby_llm/commit/0536442876be209ee20c29a1c48c2e93c89284cd
[2b6a981f]: https://github.com/crmne/ruby_llm/commit/2b6a981fd67c6856540274c243c0162f3fd4a26a
[8734d81d]: https://github.com/crmne/ruby_llm/commit/8734d81dae8f34f3f577d48878b36cc4bb4dd0f1
[101d2513]: https://github.com/crmne/ruby_llm/commit/101d2513e799f065d58cef74001b5128407e9fd0
[009015ea]: https://github.com/crmne/ruby_llm/commit/009015ea8adaad9712928179cae7b7400509ad5e
[6dd2637a]: https://github.com/crmne/ruby_llm/commit/6dd2637abe7783ddfb8aaa0a9834230eb02eedb1
[06990d66]: https://github.com/crmne/ruby_llm/commit/06990d664600d350a4126f0265bfdca47364f5bf
[3b7ebd01]: https://github.com/crmne/ruby_llm/commit/3b7ebd01514278132f226b1a3872efd472b3d8f8
[47b35420]: https://github.com/crmne/ruby_llm/commit/47b35420290c66d05f166b10c226a17021dfa5c6
[091b16a3]: https://github.com/crmne/ruby_llm/commit/091b16a330c9a70cc3d348d74d034f8ca18c2075
[fe7f9d00]: https://github.com/crmne/ruby_llm/commit/fe7f9d00c611a5d47d3f2c639a18402f5ebfba92
[c8931fb2]: https://github.com/crmne/ruby_llm/commit/c8931fb2c1ad648e4db3b65266f492a3f3178672
[993c51ea]: https://github.com/crmne/ruby_llm/commit/993c51eaee2efeba768bd1cda9e523905649a55f
[504fca4f]: https://github.com/crmne/ruby_llm/commit/504fca4fce378f83759f05bde8a24846e2b3cb78
[0f0ba2d1]: https://github.com/crmne/ruby_llm/commit/0f0ba2d1dd0fc72645b69895840ddcaa4abaf15c
[dc97623f]: https://github.com/crmne/ruby_llm/commit/dc97623f1030b1d8581191d02d600c9270f278b8
[2d5caa11]: https://github.com/crmne/ruby_llm/commit/2d5caa11829727fe0e31efebb84e703fc6d9d902
[a6a4bb88]: https://github.com/crmne/ruby_llm/commit/a6a4bb880285a2414460a9ec57fbddaa86d40a1d
[567087d3]: https://github.com/crmne/ruby_llm/commit/567087d3dde8dbf59b18bd65eef83ff52661b150
[4e769cd7]: https://github.com/crmne/ruby_llm/commit/4e769cd70ab0bac1bbabcd45b09e285bc43b2f7b
[3b3937cd]: https://github.com/crmne/ruby_llm/commit/3b3937cd8a68bef53636aafa84bc85ebed4e8b25
[a3f8b2a6]: https://github.com/crmne/ruby_llm/commit/a3f8b2a6e30577eb990b423f5df83ff4e7c23a15
[de8348ee]: https://github.com/crmne/ruby_llm/commit/de8348ee199b42e3724526afcd0217d24acc1486
[92884ae0]: https://github.com/crmne/ruby_llm/commit/92884ae0b8eb9d88131beae02b4169b4bf0f8fbf
[c781438a]: https://github.com/crmne/ruby_llm/commit/c781438af165bdb1c627dd918c1d6eacc01796b8
[d17f2c2b]: https://github.com/crmne/ruby_llm/commit/d17f2c2b187ed02b053a5029aa962ee618f2d089
[9d75b033]: https://github.com/crmne/ruby_llm/commit/9d75b033d7d00c4e1baa9b0afb4828faa8bd6602
[dd3c8481]: https://github.com/crmne/ruby_llm/commit/dd3c84812598def03d4aff77b5447c41d8f5c34e
[462f0bb0]: https://github.com/crmne/ruby_llm/commit/462f0bb0d61a9ff84d7f5d4073d59498bacacc49
[142ff20a]: https://github.com/crmne/ruby_llm/commit/142ff20a32818d8beaf173ce2f597ef901e7d241
[62d6b794]: https://github.com/crmne/ruby_llm/commit/62d6b794ceef397fbbcef87e20d370bce6beec49
[2c446372]: https://github.com/crmne/ruby_llm/commit/2c4463728d32ecaaa320a1a0891f72b3473f6cc2
[74e0cdb6]: https://github.com/crmne/ruby_llm/commit/74e0cdb616c42e5f4dfbc8374b07a2a75f775d64
[6a92f147]: https://github.com/crmne/ruby_llm/commit/6a92f147c8811b1f5edaa692d6b03f70780bcede
[d288e5be]: https://github.com/crmne/ruby_llm/commit/d288e5bea39b759e8e41965ec5c00adc29b45dd5
[83fe2cba]: https://github.com/crmne/ruby_llm/commit/83fe2cba9b97ab088c121a526aaa75eb8e4e32dd
[919a36af]: https://github.com/crmne/ruby_llm/commit/919a36af8a55aac092d2ba12235a99111799ac94
[42d74419]: https://github.com/crmne/ruby_llm/commit/42d74419fcc15146c9ab4e7e37fbe36742de188c
[40cb2925]: https://github.com/crmne/ruby_llm/commit/40cb292598d2896175f1cf5af47b1291ebbd29fd
[3ea57a31]: https://github.com/crmne/ruby_llm/commit/3ea57a3160cd09c95afcebfa374bdb2e8aaadab1
[0b7f7792]: https://github.com/crmne/ruby_llm/commit/0b7f779270edb73992f4b84dd854063253f384a6
[4282b563]: https://github.com/crmne/ruby_llm/commit/4282b5636b5987c89d53a5ba49a02d5ce5d30186
[fe8419a4]: https://github.com/crmne/ruby_llm/commit/fe8419a4c30371df67c26ec40585b4a447703aac
[ad25123f]: https://github.com/crmne/ruby_llm/commit/ad25123f72e13ec3a148e83ede43afbb2cf57d57
[97372300]: https://github.com/crmne/ruby_llm/commit/9737230025b4256d59e4aafb78bff8265ca2883a
[48a7e751]: https://github.com/crmne/ruby_llm/commit/48a7e751bc0a92ea95e8ade65fcb1f469e154ffc
[b000774e]: https://github.com/crmne/ruby_llm/commit/b000774eca9c397072c69df5c44a43b872ec59fa
[74aa1d85]: https://github.com/crmne/ruby_llm/commit/74aa1d854fc90cf4bafc027b7c094d224b30a66f
[b44bb93c]: https://github.com/crmne/ruby_llm/commit/b44bb93c685309fe344a1646134b715da00e3f76
[cd092760]: https://github.com/crmne/ruby_llm/commit/cd09276002c1a1d1ee1f214dbf6f73c327feadac
[52c4c44d]: https://github.com/crmne/ruby_llm/commit/52c4c44d451c90d1f1ac13974a20fac6d53b2e50
[e834a84f]: https://github.com/crmne/ruby_llm/commit/e834a84fa55c068bffa9fa7a3fefb22f428b0bed
[d2d61e16]: https://github.com/crmne/ruby_llm/commit/d2d61e16fed0ed6973dbd313d9a0bc66315e88b2
[dc18caed]: https://github.com/crmne/ruby_llm/commit/dc18caedef6b60cfe173cc52304e0eaa862e5994
[9f62b332]: https://github.com/crmne/ruby_llm/commit/9f62b33241abf5873f7f9cebf39d932bf8f9d924
[fdf42b5f]: https://github.com/crmne/ruby_llm/commit/fdf42b5fbf0f21977a6471343fd52746cd3ea55a
[5452cd3d]: https://github.com/crmne/ruby_llm/commit/5452cd3d8f2384afa87946b01fdd18af714075eb
[7b07bf92]: https://github.com/crmne/ruby_llm/commit/7b07bf92a276790ad782470f63e05cd33d3bf246
[b121fa8b]: https://github.com/crmne/ruby_llm/commit/b121fa8baa2d63dbfc8fdc9e64d9d2eac6227272
[b47d0f45]: https://github.com/crmne/ruby_llm/commit/b47d0f45a1936ccd4f32babdab1814f67e56102e
[691ef5c9]: https://github.com/crmne/ruby_llm/commit/691ef5c9ffcc7d938232af703cdab70e2f682db3
[67a1d2a0]: https://github.com/crmne/ruby_llm/commit/67a1d2a0b9566121f25f20d115d954ca9f64627f
[cd61467b]: https://github.com/crmne/ruby_llm/commit/cd61467b5b6e82dd3f29cdede0168cb48e3594d0
[f1cf3b0e]: https://github.com/crmne/ruby_llm/commit/f1cf3b0e92e3e9244a94a2c1b5c7d4f2716d2aae
[a517b71a]: https://github.com/crmne/ruby_llm/commit/a517b71a5625b354b8af94a67ff40475ca7414c2
[ec710421]: https://github.com/crmne/ruby_llm/commit/ec7104214aa33ed036454e5f603a203c0b3158f6
[e68aefd6]: https://github.com/crmne/ruby_llm/commit/e68aefd6bd36eb7ea4eb072593443e4e0388fdcc
[73c02883]: https://github.com/crmne/ruby_llm/commit/73c02883f5bbfa64bc2f1439329552f6a7a8514e
[e7a15427]: https://github.com/crmne/ruby_llm/commit/e7a1542721e0fb6ddded1c288c5552be14401ded
[d112146a]: https://github.com/crmne/ruby_llm/commit/d112146a53bd16afd41e08c310c9b11c8a26a3b7
[9b30f939]: https://github.com/crmne/ruby_llm/commit/9b30f939fe96b461e62ac62314350cf5c54f1394
