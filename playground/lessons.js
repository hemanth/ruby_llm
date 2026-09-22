/**
 * RubyLLM Interactive Playground - Lessons Curriculum
 * 30+ hands-on lessons covering the complete RubyLLM 2.0 and Rails API.
 */

export const lessons = [
  // =========================================================================
  // CATEGORY 1: Core Chat
  // =========================================================================
  {
    id: "first-chat",
    category: "Core Chat",
    title: "Your First Chat",
    description: `
Welcome to **RubyLLM**! In RubyLLM, text generation and conversations are centered around \`RubyLLM.chat\`.

Calling \`RubyLLM.chat.ask\` sends a message to the default model and returns a typed \`RubyLLM::Message\` object.

\`\`\`ruby
response = RubyLLM.chat.ask "What is Ruby?"
puts response.content
\`\`\`

Every response has helpers like \`.content\`, \`.role\`, and \`.tokens\`.
    `.trim(),
    starterCode: `# Create a chat and ask your first question
chat = RubyLLM.chat
response = chat.ask "What makes Ruby a great language for AI development?"

puts "Response from #{chat.model}:"
puts response.content
`,
    exercise: `**Exercise:** Print the number of tokens used in this request using \`response.tokens.total\` and print the message role using \`response.role\`.`,
    hint: "Access `response.tokens.total` and `response.role` directly on the returned response object.",
    solution: `chat = RubyLLM.chat
response = chat.ask "What makes Ruby a great language for AI development?"

puts "Response from #{chat.model}:"
puts response.content
puts "Role: #{response.role}"
puts "Total Tokens: #{response.tokens.total}"
`,
  },

  {
    id: "streaming",
    category: "Core Chat",
    title: "Streaming Responses",
    description: `
In real applications, waiting for a long response feels slow. RubyLLM lets you stream response tokens in real-time by passing a block to \`ask\`.

\`\`\`ruby
chat.ask "Write a haiku about Ruby" do |chunk|
  print chunk.content
end
\`\`\`

Each chunk yields a \`RubyLLM::Chunk\` with the text fragment in \`chunk.content\`. The method still returns the final aggregated \`Message\` object when streaming finishes!
    `.trim(),
    starterCode: `chat = RubyLLM.chat

print "Streaming: "
message = chat.ask "Tell me a short story about the birth of Ruby" do |chunk|
  print chunk.content
end

puts "\\n\\nStream complete! Final message length: #{message.content.length} chars"
`,
    exercise: `**Exercise:** Count how many chunks were streamed by declaring a counter before the call and incrementing it inside the block. Print the total chunk count.`,
    hint: "Initialize `chunk_count = 0` outside the block, increment it with `chunk_count += 1` inside `chat.ask do |chunk|`, and `puts` it at the end.",
    solution: `chat = RubyLLM.chat

chunk_count = 0
print "Streaming: "
message = chat.ask "Tell me a short story about the birth of Ruby" do |chunk|
  chunk_count += 1
  print chunk.content
end

puts "\\n\\nStream complete! Chunks received: #{chunk_count}"
puts "Final message length: #{message.content.length} chars"
`,
  },

  {
    id: "multi-turn",
    category: "Core Chat",
    title: "Conversation History",
    description: `
A \`Chat\` instance retains conversation history locally in \`chat.messages\`. Every call to \`ask\` appends both the user's prompt and the model's reply.

You can inspect previous messages, count them, or filter by role:
\`\`\`ruby
chat.messages.each do |msg|
  puts "[#{msg.role.upcase}] #{msg.content}"
end
\`\`\`
    `.trim(),
    starterCode: `chat = RubyLLM.chat

chat.ask "Hi! My name is Alice and I love Ruby."
chat.ask "What is my name and what language do I love?"

puts "Conversation Transcript (#{chat.messages.count} messages):"
chat.messages.each do |msg|
  puts "[#{msg.role.upcase}] #{msg.content}"
end
`,
    exercise: `**Exercise:** Ask a 3rd question: "Recommend one gem for me." Then print only the assistant's messages by filtering with \`chat.messages.select(&:assistant?)\`.`,
    hint: "Call `chat.ask \"Recommend one gem for me.\"` then use `chat.messages.select(&:assistant?)` to display only assistant replies.",
    solution: `chat = RubyLLM.chat

chat.ask "Hi! My name is Alice and I love Ruby."
chat.ask "What is my name and what language do I love?"
chat.ask "Recommend one gem for me."

puts "Assistant Replies:"
chat.messages.select(&:assistant?).each do |msg|
  puts "-> #{msg.content}"
end
`,
  },

  {
    id: "system-instructions",
    category: "Core Chat",
    title: "Instructions & Temperature",
    description: `
You can control the persona and determinism of a chat using chainable setters:
- \`.with_instructions("...")\` sets the system prompt.
- \`.with_temperature(0.2)\` controls randomness (lower = deterministic, higher = creative).

All setters return \`self\` so you can chain them smoothly:
\`\`\`ruby
chat = RubyLLM.chat
chat.with_instructions("You are a strict code reviewer. Be concise.")
chat.with_temperature(0.1)
\`\`\`
    `.trim(),
    starterCode: `chat = RubyLLM.chat
chat.with_instructions("You are an enthusiastic Ruby cheerleader. Use lots of emojis and cheer for every Ruby feature!")
chat.with_temperature(0.9)

response = chat.ask "Should I use Ruby for my next project?"
puts response.content
`,
    exercise: `**Exercise:** Reconfigure the chat with instructions to act as a "Pirate Captain" and set temperature to \`0.4\`. Ask "What is an array in Ruby?".`,
    hint: "Call `chat.with_instructions(\"You are a pirate captain.\")` and `chat.with_temperature(0.4)`, then call `.ask`.",
    solution: `chat = RubyLLM.chat
chat.with_instructions("You are a Pirate Captain. Speak in pirate dialect at all times!")
chat.with_temperature(0.4)

response = chat.ask "What is an array in Ruby?"
puts response.content
`,
  },

  {
    id: "thinking",
    category: "Core Chat",
    title: "Extended Thinking & Reasoning",
    description: `
Modern reasoning models (like Claude 3.7 Sonnet or o3-mini) support extended deliberation before answering.

In RubyLLM, configure reasoning with \`.with_thinking(effort: :high)\` or \`:medium\` / \`:low\`. The thought process is exposed via \`message.thinking\`.

\`\`\`ruby
chat = RubyLLM.chat(model: "claude-3.7-sonnet")
chat.with_thinking(effort: :high)

response = chat.ask "Solve this logic puzzle..."
puts response.thinking # Model's chain of thought
puts response.content  # Final answer
\`\`\`
    `.trim(),
    starterCode: `chat = RubyLLM.chat(model: "claude-3.7-sonnet")
chat.with_thinking(effort: :high)

response = chat.ask "How many r's are in the word 'strawberry'?"

if response.thinking
  puts "=== Thought Process ==="
  puts response.thinking
  puts "======================="
end

puts "\\nFinal Answer:"
puts response.content
`,
    exercise: `**Exercise:** Change the thinking effort to \`:medium\` and ask: "Which is heavier: a pound of gold or a pound of feathers?". Print the reasoning and final answer.`,
    hint: "Update `effort: :medium` in `chat.with_thinking(effort: :medium)`.",
    solution: `chat = RubyLLM.chat(model: "claude-3.7-sonnet")
chat.with_thinking(effort: :medium)

response = chat.ask "Which is heavier: a pound of gold or a pound of feathers?"

if response.thinking
  puts "=== Reasoning ==="
  puts response.thinking
end

puts "\\nAnswer: #{response.content}"
`,
  },

  {
    id: "model-selection",
    category: "Core Chat",
    title: "Model Selection & Capabilities",
    description: `
RubyLLM connects to 18 providers through one unified API. You can switch models effortlessly:
- \`"gpt-5.6-luna"\` (OpenAI)
- \`"claude-3.7-sonnet"\` (Anthropic)
- \`"gemini-3.7-flash"\` (Google)
- \`"mistral-large"\` (Mistral)

You can query capabilities directly:
\`\`\`ruby
model = RubyLLM.models.find("gemini-3.7-flash")
model.supports?(:vision) # => true
\`\`\`
    `.trim(),
    starterCode: `# Easily switch models without changing your application code
gemini = RubyLLM.chat(model: "gemini-3.7-flash")
puts "Created chat with #{gemini.model}"

res = gemini.ask "Give me a one-line tip for writing idiomatic Ruby."
puts res.content
`,
    exercise: `**Exercise:** Create a second chat with \`claude-3.7-sonnet\`, ask the same question, and compare the two model identifiers.`,
    hint: "Use `claude = RubyLLM.chat(model: \"claude-3.7-sonnet\")` and call `.ask`.",
    solution: `gemini = RubyLLM.chat(model: "gemini-3.7-flash")
puts "Gemini (#{gemini.model}):"
puts gemini.ask("Give me a one-line tip for writing idiomatic Ruby.").content

claude = RubyLLM.chat(model: "claude-3.7-sonnet")
puts "\\nClaude (#{claude.model}):"
puts claude.ask("Give me a one-line tip for writing idiomatic Ruby.").content
`,
  },

  // =========================================================================
  // CATEGORY 2: Tools & HITL Loop
  // =========================================================================
  {
    id: "custom-tools",
    category: "Tools & Loop",
    title: "Defining Custom Tools",
    description: `
Tools let models execute your Ruby code! In RubyLLM, a tool is a plain Ruby class inheriting from \`RubyLLM::Tool\`.

Use the DSL to document the tool:
- \`description "..."\` describes what the tool does.
- \`param :name, type: :string, desc: "..."\` specifies arguments.
- \`execute(**kwargs)\` contains the Ruby implementation.
    `.trim(),
    starterCode: `class Weather < RubyLLM::Tool
  description "Get the current weather for a location"
  param :location, type: :string, desc: "City or region name", required: true

  def execute(location:)
    # In real apps, call an API like Open-Meteo
    { location: location, temp_c: 21.0, condition: "Sunny" }
  end
end

puts "Defined tool: #{Weather.name}"
puts "Description: #{Weather.tool_description}"
puts "Parameters: #{Weather.tool_params.keys.inspect}"
`,
    exercise: `**Exercise:** Define a \`Calculator\` tool that takes \`a\` and \`b\` as numbers and an \`operation\` as a string. Return the result in \`execute\`.`,
    hint: "Create `class Calculator < RubyLLM::Tool` and define `def execute(a:, b:, operation:)` with `+`, `-`, `*`, or `/` logic.",
    solution: `class Calculator < RubyLLM::Tool
  description "Perform basic arithmetic calculations"
  param :a, type: :number, desc: "First number"
  param :b, type: :number, desc: "Second number"
  param :operation, type: :string, desc: "Operation: add, subtract, multiply, divide"

  def execute(a:, b:, operation:)
    case operation.to_s.downcase
    when "add", "+" then a + b
    when "subtract", "-" then a - b
    when "multiply", "*" then a * b
    when "divide", "/" then b.zero? ? "Error: Div by zero" : (a.to_f / b)
    else "Unknown operation"
    end
  end
end

calc = Calculator.new
puts "Test Calculator (5 * 7): #{calc.execute(a: 5, b: 7, operation: 'multiply')}"
`,
  },

  {
    id: "agentic-loop",
    category: "Tools & Loop",
    title: "The Autonomous Agentic Loop",
    description: `
When you register tools with \`chat.with_tools(Weather)\`, the model can invoke them automatically!

The agentic loop handles the back-and-forth:
1. The user asks a question requiring external data.
2. The model requests a tool call.
3. RubyLLM automatically runs the tool in Ruby.
4. The tool result is fed back into the conversation.
5. The model synthesizes the final response for the user.
    `.trim(),
    starterCode: `class WeatherTool < RubyLLM::Tool
  description "Get current weather in a city"
  param :city, type: :string, desc: "City name"

  def execute(city:)
    { city: city, temp: "18.5°C", weather: "Partly Cloudy" }
  end
end

chat = RubyLLM.chat.with_tools(WeatherTool)
response = chat.ask "What is the weather like in Berlin today?"

puts response.content
puts "\\nTotal messages exchanged in loop: #{chat.messages.count}"
`,
    exercise: `**Exercise:** Inspect the messages in the transcript and find the tool execution message using \`chat.messages.find(&:tool?)\`. Print its content.`,
    hint: "Call `tool_msg = chat.messages.find(&:tool?)` and print `tool_msg.content`.",
    solution: `class WeatherTool < RubyLLM::Tool
  description "Get current weather in a city"
  param :city, type: :string, desc: "City name"

  def execute(city:)
    { city: city, temp: "18.5°C", weather: "Partly Cloudy" }
  end
end

chat = RubyLLM.chat.with_tools(WeatherTool)
response = chat.ask "What is the weather like in Berlin today?"

puts response.content

tool_msg = chat.messages.find(&:tool?)
if tool_msg
  puts "\\nFound Tool Message in Transcript:"
  puts tool_msg.content
end
`,
  },

  {
    id: "tool-approvals",
    category: "Tools & Loop",
    title: "Human-in-the-Loop & Tool Approvals",
    description: `
Some tools are sensitive (e.g. deleting records, sending emails, transferring funds). RubyLLM includes native **Human-in-the-Loop (HITL)** support.

Declare \`requires_approval true\` on a tool class. When the model invokes it:
1. The run pauses.
2. The call enters \`chat.pending_tool_calls\`.
3. A human reviews and calls \`chat.approve(call.id)\` or \`chat.reject(call.id)\`.
4. The loop resumes!
    `.trim(),
    starterCode: `class DeployTool < RubyLLM::Tool
  description "Deploy application to production server"
  param :branch, type: :string, desc: "Branch to deploy"
  requires_approval true

  def execute(branch:)
    "Successfully deployed #{branch} to production!"
  end
end

chat = RubyLLM.chat.with_tools(DeployTool)
response = chat.ask "Deploy the main branch to production immediately"

puts "Chat complete? #{chat.complete?}"
puts "Pending calls count: #{chat.pending_tool_calls.size}"

if (pending = chat.pending_tool_calls.first)
  puts "Pending call #{pending.id} for tool: #{pending.name}"
  
  # Approve the call
  chat.approve(pending.id)
  puts "Approved! Now complete? #{chat.complete?}"
end
`,
    exercise: `**Exercise:** Write a reject flow: define another tool \`DeleteDatabase\` with \`requires_approval true\`. Prompt the chat to run it, inspect the pending call, and call \`chat.reject(pending.id)\`.`,
    hint: "Use `chat.reject(pending.id)` to decline a sensitive action.",
    solution: `class DeleteDatabase < RubyLLM::Tool
  description "Delete the entire production database"
  requires_approval true

  def execute
    "Database wiped!"
  end
end

chat = RubyLLM.chat.with_tools(DeleteDatabase)
chat.ask "Wipe the production database now"

pending = chat.pending_tool_calls.first
puts "Pending Call: #{pending.name} (#{pending.id})"
chat.reject(pending.id)
puts "Call status: #{pending.status}"
`,
  },

  {
    id: "manual-stepping",
    category: "Tools & Loop",
    title: "Manual Loop Stepping",
    description: `
Need fine-grained control over each turn of the agentic loop? Instead of letting \`ask\` run automatically to completion, you can drive the loop step-by-step:

- \`chat.ask_later(prompt)\` queues the user message without executing.
- \`chat.step\` executes exactly one turn.
- \`chat.complete?\` checks if all tool calls and answers have settled.
    `.trim(),
    starterCode: `class PriceLookup < RubyLLM::Tool
  description "Lookup product price"
  param :sku, type: :string

  def execute(sku:)
    { sku: sku, price: 99.00 }
  end
end

chat = RubyLLM.chat.with_tools(PriceLookup)
chat.ask_later "What is the price of SKU-1234?"

puts "Initial complete? #{chat.complete?}"

# Step 1: LLM selects tool
chat.step

# Step 2: Tool execution & final response
chat.step

puts "After stepping, complete? #{chat.complete?}"
puts "Latest response: #{chat.messages.last.content}"
`,
    exercise: `**Exercise:** Use a \`while !chat.complete?\` loop with a safety counter (\`max_steps = 5\`) to step the chat until it finishes.`,
    hint: "Initialize `steps = 0`, then `while !chat.complete? && steps < 5; chat.step; steps += 1; end`.",
    solution: `class PriceLookup < RubyLLM::Tool
  description "Lookup product price"
  param :sku, type: :string

  def execute(sku:)
    { sku: sku, price: 99.00 }
  end
end

chat = RubyLLM.chat.with_tools(PriceLookup)
chat.ask_later "What is the price of SKU-1234?"

steps = 0
while !chat.complete? && steps < 5
  steps += 1
  puts "Executing step #{steps}..."
  chat.step
end

puts "Finished in #{steps} steps!"
puts "Final answer: #{chat.messages.last.content}"
`,
  },

  {
    id: "provider-tools",
    category: "Tools & Loop",
    title: "Provider Tools & Web Search",
    description: `
In addition to custom Ruby tools, many providers offer native built-in capabilities, such as web search, code interpreters, or MCP (Model Context Protocol) servers.

Enable them with \`with_provider_tools\`:
\`\`\`ruby
chat.with_provider_tools(:web_search, :code_interpreter)
\`\`\`
    `.trim(),
    starterCode: `chat = RubyLLM.chat(model: "gemini-3.7-flash")
chat.with_provider_tools(:web_search)

response = chat.ask "What were the major announcements at the latest RubyConf?"
puts response.content
`,
    exercise: `**Exercise:** Enable both \`:web_search\` and \`:code_interpreter\` and ask "Compute the 50th Fibonacci number using code execution".`,
    hint: "Pass both symbols to `chat.with_provider_tools(:web_search, :code_interpreter)`.",
    solution: `chat = RubyLLM.chat(model: "gemini-3.7-flash")
chat.with_provider_tools(:web_search, :code_interpreter)

response = chat.ask "Compute the 50th Fibonacci number using code execution"
puts response.content
`,
  },

  // =========================================================================
  // CATEGORY 3: Agents & Schemas
  // =========================================================================
  {
    id: "reusable-agent",
    category: "Agents & Schemas",
    title: "Reusable Agents with RubyLLM::Agent",
    description: `
Instead of configuring \`Chat\` objects manually everywhere, define reusable agents by subclassing \`RubyLLM::Agent\`.

Use clean class macros:
\`\`\`ruby
class SupportAgent < RubyLLM::Agent
  model "gpt-5.6-luna"
  instructions "You are customer support for a SaaS app. Be courteous."
  tools WeatherTool
  temperature 0.3
end

SupportAgent.new.ask "Help me with my account"
\`\`\`
    `.trim(),
    starterCode: `class TechLeadAgent < RubyLLM::Agent
  model "gpt-5.6-luna"
  instructions "You are a pragmatic Staff Software Engineer. Focus on clean architecture and simplicity."
  temperature 0.2
end

lead = TechLeadAgent.new
response = lead.ask "Should we microservice our Rails app on day one?"

puts response.content
`,
    exercise: `**Exercise:** Define a \`RubyTutorAgent\` that uses \`gemini-3.7-flash\` and teaches beginner concepts with code examples. Ask it to explain what a symbol is.`,
    hint: "Subclass `RubyLLM::Agent`, specify `model \"gemini-3.7-flash\"` and `instructions \"...\"`, then instantiate and call `.ask`.",
    solution: `class RubyTutorAgent < RubyLLM::Agent
  model "gemini-3.7-flash"
  instructions "You are a friendly Ruby tutor. Always provide short, clear code examples."
  temperature 0.4
end

tutor = RubyTutorAgent.new
puts tutor.ask("Explain what a symbol is in Ruby.").content
`,
  },

  {
    id: "agent-configuration",
    category: "Agents & Schemas",
    title: "Agent Instance Overrides",
    description: `
While an \`Agent\` defines default class macros, every instance can accept runtime overrides:

\`\`\`ruby
agent = SupportAgent.new(temperature: 0.8, instructions: "Custom prompt")
\`\`\`

You can also access the underlying \`chat\` object via \`agent.chat\` to inspect messages, tokens, and cost.
    `.trim(),
    starterCode: `class AnalystAgent < RubyLLM::Agent
  model "gpt-5.6-luna"
  instructions "Analyze data with precision."
end

# Override temperature and instructions on creation
custom_analyst = AnalystAgent.new(
  temperature: 0.1,
  instructions: "Analyze data specifically for a CFO looking at cost-cutting."
)

res = custom_analyst.ask "How should we assess server infrastructure spending?"
puts res.content
puts "\\nTokens used: #{custom_analyst.chat.tokens.total}"
puts "Cost: #{custom_analyst.chat.cost}"
`,
    exercise: `**Exercise:** Create an instance of \`AnalystAgent\` that overrides the model to \`\"claude-3.7-sonnet\"\`. Verify by printing \`agent.chat.model\`.`,
    hint: "Pass `model: \"claude-3.7-sonnet\"` to `AnalystAgent.new(...)`.",
    solution: `class AnalystAgent < RubyLLM::Agent
  model "gpt-5.6-luna"
  instructions "Analyze data with precision."
end

agent = AnalystAgent.new(model: "claude-3.7-sonnet")
puts "Agent Model: #{agent.chat.model}"
puts agent.ask("Summarize cloud cost trends.").content
`,
  },

  {
    id: "structured-output",
    category: "Agents & Schemas",
    title: "Structured Output & Schemas",
    description: `
Need guaranteed JSON matching a schema? RubyLLM provides typed structured outputs via \`with_schema\`.

Define your schema using \`Schematist::Schema\` or a Ruby Hash. Read the typed result with \`response.parsed\`:

\`\`\`ruby
class BookSchema < Schematist::Schema
  string :title
  string :author
  number :year
  array :genres do
    string
  end
end

response = chat.with_schema(BookSchema).ask "Analyze The Hobbit"
puts response.parsed.title
puts response.parsed.genres.inspect
\`\`\`
    `.trim(),
    starterCode: `class ProductReviewSchema < Schematist::Schema
  string :product_name
  number :rating
  string :sentiment
  array :highlights do
    string
  end
end

chat = RubyLLM.chat.with_schema(ProductReviewSchema)
response = chat.ask "Review the mechanical keyboard: 5 stars, great tactility, clicky keys!"

parsed = response.parsed
puts "Product: #{parsed.name}"
puts "Price: $#{parsed.price}"
puts "Features: #{parsed.features.join(', ')}"
`,
    exercise: `**Exercise:** Print each feature on its own bulleted line by iterating over \`parsed.features.each\`.`,
    hint: "Use `parsed.features.each { |f| puts \"* #{f}\" }`.",
    solution: `class ProductReviewSchema < Schematist::Schema
  string :product_name
  number :rating
  string :sentiment
  array :highlights do
    string
  end
end

chat = RubyLLM.chat.with_schema(ProductReviewSchema)
response = chat.ask "Review the mechanical keyboard: 5 stars, great tactility, clicky keys!"

parsed = response.parsed
puts "Product: #{parsed.name} ($#{parsed.price})"
puts "Highlights:"
parsed.features.each do |feature|
  puts " - #{feature}"
end
`,
  },

  {
    id: "fallbacks",
    category: "Agents & Schemas",
    title: "Model Fallbacks & Resilience",
    description: `
AI provider outages happen. RubyLLM allows you to configure backup models with \`.with_fallbacks\`.

If the primary model is rate-limited or unavailable, RubyLLM transparently attempts the fallback models in order:

\`\`\`ruby
chat = RubyLLM.chat(model: "gpt-5.6-luna")
chat.with_fallbacks("claude-3.7-sonnet", "gemini-3.7-flash")
\`\`\`
    `.trim(),
    starterCode: `chat = RubyLLM.chat(model: "gpt-5.6-luna")
chat.with_fallbacks("claude-3.7-sonnet", "gemini-3.7-flash")

puts "Primary model: #{chat.model}"
puts "Configured fallbacks: #{chat.fallbacks.inspect}"

response = chat.ask "Why is redundancy essential in production AI systems?"
puts "\nAnswer:"
puts response.content
`,
    exercise: `**Exercise:** Add \`"mistral-large"\` to the fallback chain. Print how many fallback models are registered.`,
    hint: "Update `chat.with_fallbacks` to include 3 models and print `chat.fallbacks.size`.",
    solution: `chat = RubyLLM.chat(model: "gpt-5.6-luna")
chat.with_fallbacks("claude-3.7-sonnet", "gemini-3.7-flash", "mistral-large")

puts "Total fallbacks: #{chat.fallbacks.size}"
puts "Fallback list: #{chat.fallbacks.join(' -> ')}"
`,
  },

  {
    id: "prompt-caching",
    category: "Agents & Schemas",
    title: "Prompt Caching & Compaction",
    description: `
When working with large system prompts, extensive documentation, or long conversation histories, **Prompt Caching** saves up to 90% in token costs and latency.

Enable caching with \`.with_caching(true)\`. For conversations that exceed token budgets, enable provider compaction with \`.with_compaction(true)\`.
    `.trim(),
    starterCode: `chat = RubyLLM.chat
chat.with_caching(true)
chat.with_compaction(true)

puts "Caching enabled? #{chat.caching_enabled}"
puts "Compaction enabled? #{chat.compaction_enabled}"

response = chat.ask "Summarize the architectural benefits of prompt caching."
puts "\n" + response.content
`,
    exercise: `**Exercise:** Check cache usage on tokens: inspect \`response.tokens.cache_read\` and \`response.tokens.cache_write\`.`,
    hint: "Print `response.tokens.cache_read` and `response.tokens.cache_write`.",
    solution: `chat = RubyLLM.chat
chat.with_caching(true)
chat.with_compaction(true)

response = chat.ask "Summarize the architectural benefits of prompt caching."
puts response.content
puts "\nCache Read Tokens: #{response.tokens.cache_read}"
puts "Cache Write Tokens: #{response.tokens.cache_write}"
`,
  },

  // =========================================================================
  // CATEGORY 4: Multimodal & Creative Ops
  // =========================================================================
  {
    id: "vision",
    category: "Multimodal",
    title: "Vision: Asking About Images",
    description: `
RubyLLM makes multimodal AI natural. Pass local image paths or remote URLs to the \`with:\` keyword argument in \`chat.ask\`:

\`\`\`ruby
chat = RubyLLM.chat(model: "gemini-3.7-flash")
chat.ask "What is shown in this diagram?", with: "architecture.png"
\`\`\`

RubyLLM automatically inspects MIME types, base64-encodes or uploads files, and translates them to the provider's protocol.
    `.trim(),
    starterCode: `chat = RubyLLM.chat(model: "gemini-3.7-flash")

# Ask about an image file
response = chat.ask "Describe the key elements of this diagram and identify any bottlenecks.", with: "architecture_diagram.png"

puts response.content
`,
    exercise: `**Exercise:** Ask the model to compare two images by passing an array: \`with: ["v1_wireframe.png", "v2_final.png"]\`.`,
    hint: "Pass an array of filenames to the `with:` argument.",
    solution: `chat = RubyLLM.chat(model: "gemini-3.7-flash")

response = chat.ask "Compare the UX improvements between these two revisions.", with: ["v1_wireframe.png", "v2_final.png"]

puts response.content
`,
  },

  {
    id: "paint",
    category: "Multimodal",
    title: "Image Generation: RubyLLM.paint",
    description: `
Generate images using \`RubyLLM.paint\`. It returns a \`RubyLLM::Image\` value object that responds to \`.save(path)\`, \`.url\`, and \`.revised_prompt\`.

No need to instantiate a chat — operations are standalone!
\`\`\`ruby
image = RubyLLM.paint "A ruby crystal glowing inside an ancient library"
image.save "gem.png"
\`\`\`
    `.trim(),
    starterCode: `image = RubyLLM.paint "A majestic red ruby floating above an open book of code, digital art, 4k", model: "dall-e-3"

puts "Generated image URL: #{image.url}"
puts "Revised prompt: #{image.revised_prompt}"

# Save to disk
image.save "ruby_glow.png"
`,
    exercise: `**Exercise:** Call \`RubyLLM.paint\` to create a logo concept: "Minimalist geometric logo for a Ruby AI startup". Print the path where it gets saved.`,
    hint: "Call `logo = RubyLLM.paint(...)` then `saved_path = logo.save(\"logo.png\")` and print `saved_path`.",
    solution: `logo = RubyLLM.paint "Minimalist geometric logo for a Ruby AI startup, dark background, neon teal accents", model: "dall-e-3"

saved = logo.save("logo.png")
puts "Saved logo to: #{saved}"
puts "Image preview URL: #{logo.url}"
`,
  },

  {
    id: "animate",
    category: "Multimodal",
    title: "Video Generation: RubyLLM.animate",
    description: `
Generate video clips with \`RubyLLM.animate\`. This connects to video generation models like Sora or Runway.

Returns a \`RubyLLM::Video\` object with \`.duration_seconds\`, \`.status\`, and \`.save(path)\`.
    `.trim(),
    starterCode: `video = RubyLLM.animate "A paper origami boat sailing down an autumn stream during golden hour", model: "sora-2"

puts "Video Status: #{video.status}"
puts "Duration: #{video.duration_seconds} seconds"
video.save "boat.mp4"
`,
    exercise: `**Exercise:** Generate a 5-second video: "Time-lapse of stars revolving around Polaris in the night sky". Save it to \`"stars.mp4"\`.`,
    hint: "Call `RubyLLM.animate(\"...\")` and invoke `.save(\"stars.mp4\")`.",
    solution: `video = RubyLLM.animate "Time-lapse of stars revolving around Polaris in the night sky", model: "sora-2"

puts "Status: #{video.status}"
video.save "stars.mp4"
`,
  },

  {
    id: "speak",
    category: "Multimodal",
    title: "Text to Speech: RubyLLM.speak",
    description: `
Turn text into realistic speech with \`RubyLLM.speak\`.

Configure voices (e.g. \`"alloy"\`, \`"echo"\`, \`"fable"\`, \`"onyx"\`, \`"nova"\`, \`"shimmer"\`).
Save the audio output directly using \`.save(path)\`:

\`\`\`ruby
speech = RubyLLM.speak "Welcome to RubyLLM, the Ruby-native AI framework."
speech.save "welcome.mp3"
\`\`\`
    `.trim(),
    starterCode: `text = "Hello! Today we are learning how to build autonomous AI agents in Ruby."

speech = RubyLLM.speak text, voice: "alloy", model: "tts-1-hd"

puts "Synthesized: #{speech.text}"
puts "Voice: #{speech.voice}"
puts "Estimated Duration: #{speech.duration_seconds}s"
speech.save "intro.mp3"
`,
    exercise: `**Exercise:** Change the voice to \`"nova"\` and synthesize: "Deployment successful. All systems operational." Save to \`"alert.mp3"\`.`,
    hint: "Use `RubyLLM.speak(\"...\", voice: \"nova\").save(\"alert.mp3\")`.",
    solution: `speech = RubyLLM.speak "Deployment successful. All systems operational.", voice: "nova"

puts "Audio length: #{speech.duration_seconds}s"
speech.save "alert.mp3"
`,
  },

  {
    id: "transcribe",
    category: "Multimodal",
    title: "Speech to Text: RubyLLM.transcribe",
    description: `
Transcribe audio files into text with \`RubyLLM.transcribe\`.

The returned \`Transcription\` object includes the full text and timed segments with timestamps.
    `.trim(),
    starterCode: `transcript = RubyLLM.transcribe("meeting_recording.mp3")

puts "Full Transcript:"
puts transcript.text
puts "\\nLanguage Detected: #{transcript.language}"
puts "\\nSegment breakdown:"
transcript.segments.each do |seg|
  puts "[#{seg[:start]}s -> #{seg[:end]}s]: #{seg[:text]}"
end
`,
    exercise: `**Exercise:** Calculate and print the total duration of the transcription by reading the \`end\` time of the last segment.`,
    hint: "Use `transcript.segments.last[:end]` to find the final timestamp.",
    solution: `transcript = RubyLLM.transcribe("meeting_recording.mp3")

puts "Full Transcript: #{transcript.text}"
last_time = transcript.segments.last[:end]
puts "Total Audio Duration: #{last_time} seconds"
`,
  },

  // =========================================================================
  // CATEGORY 5: Search, RAG & Accounting
  // =========================================================================
  {
    id: "ocr",
    category: "Search & Ops",
    title: "Document OCR: RubyLLM.ocr",
    description: `
Extract structured Markdown and tables from PDFs, scanned documents, and forms with \`RubyLLM.ocr\`.

It handles complex multi-column layouts, receipts, and invoices:
\`\`\`ruby
doc = RubyLLM.ocr "invoice.pdf"
puts doc.markdown
\`\`\`
    `.trim(),
    starterCode: `doc = RubyLLM.ocr("invoice_september.pdf", model: "mistral-ocr")

puts "=== Extracted Document Markdown ==="
puts doc.markdown
`,
    exercise: `**Exercise:** Check if the extracted markdown contains a table by testing \`doc.markdown.include?("|")\`. Print "Table detected" or "No tables found".`,
    hint: "Use `if doc.markdown.include?(\"|\") ... end`.",
    solution: `doc = RubyLLM.ocr("invoice_september.pdf")

puts doc.markdown

if doc.markdown.include?("|")
  puts "\\n[SUCCESS] Table structure detected in document!"
else
  puts "\\nNo tables found."
end
`,
  },

  {
    id: "embeddings",
    category: "Search & Ops",
    title: "Vector Embeddings: RubyLLM.embed",
    description: `
Generate vector embeddings for semantic search, clustering, and retrieval-augmented generation (RAG) using \`RubyLLM.embed\`.

Returns an \`Embedding\` object containing high-dimensional float vectors:
\`\`\`ruby
embedding = RubyLLM.embed "Ruby makes developers happy"
puts embedding.vectors.inspect
puts embedding.dimensions # => 1536
\`\`\`
    `.trim(),
    starterCode: `phrase1 = "Building web applications with Rails"
phrase2 = "Developing AI agents with RubyLLM"

emb1 = RubyLLM.embed(phrase1)
emb2 = RubyLLM.embed(phrase2)

puts "Dimensions: #{emb1.dimensions}"
puts "First 4 vector weights for '#{phrase1}':"
puts emb1.vectors[0..3].inspect
`,
    exercise: `**Exercise:** Calculate the dot product of the first 4 dimensions between \`emb1\` and \`emb2\`.`,
    hint: "Use `(0..3).sum { |i| emb1.vectors[i] * emb2.vectors[i] }`.",
    solution: `emb1 = RubyLLM.embed("Building web applications with Rails")
emb2 = RubyLLM.embed("Developing AI agents with RubyLLM")

dot_product = (0..3).sum { |i| emb1.vectors[i] * emb2.vectors[i] }
puts "Vector preview 1: #{emb1.vectors[0..3].inspect}"
puts "Vector preview 2: #{emb2.vectors[0..3].inspect}"
puts "Partial dot product: #{dot_product.round(4)}"
`,
  },

  {
    id: "rerank",
    category: "Search & Ops",
    title: "Semantic Reranking: RubyLLM.rerank",
    description: `
In RAG pipelines, keyword search often retrieves irrelevant documents. **Reranking** uses specialized cross-encoder models to reorder search candidates by exact query relevance.

\`\`\`ruby
ranked = RubyLLM.rerank(query, documents, model: "rerank-v3.5")
top_doc = ranked.results.first.document
\`\`\`
    `.trim(),
    starterCode: `query = "How do I reset my password?"
docs = [
  "Invoices arrive on the 1st of every month.",
  "You can reset your password under Account Settings -> Security.",
  "To invite team members, visit the Organization tab.",
  "Forgotten passwords can be recovered via the login screen link."
]

ranked = RubyLLM.rerank(query, docs)

puts "Query: #{ranked.query}"
puts "\\nReranked Results (Highest relevance first):"
ranked.results.each_with_index do |item, rank|
  puts "#{rank + 1}. [Score: #{item.relevance_score}] #{item.document}"
end
`,
    exercise: `**Exercise:** Extract only the documents with a relevance score greater than \`0.80\` and print them.`,
    hint: "Filter with `ranked.results.select { |r| r.relevance_score > 0.80 }`.",
    solution: `query = "How do I reset my password?"
docs = [
  "Invoices arrive on the 1st of every month.",
  "You can reset your password under Account Settings -> Security.",
  "To invite team members, visit the Organization tab.",
  "Forgotten passwords can be recovered via the login screen link."
]

ranked = RubyLLM.rerank(query, docs)

high_relevance = ranked.results.select { |r| r.relevance_score > 0.80 }
puts "Documents above 80% relevance:"
high_relevance.each do |item|
  puts "• #{item.document} (#{item.relevance_score})"
end
`,
  },

  {
    id: "moderation",
    category: "Search & Ops",
    title: "Content Moderation: RubyLLM.moderate",
    description: `
Before displaying or persisting user-generated content, test it against safety policies using \`RubyLLM.moderate\`.

Returns a \`ModerationResult\` with a \`.flagged?\` predicate, category booleans, and probability scores.
    `.trim(),
    starterCode: `user_comment = "RubyLLM makes building AI features in Rails so much fun!"

mod = RubyLLM.moderate(user_comment)

puts "Comment: #{user_comment.inspect}"
puts "Flagged? #{mod.flagged?}"
puts "Category Breakdown:"
mod.categories.each do |category, flagged|
  puts " - #{category}: #{flagged ? 'FLAGGED' : 'PASS'}"
end
`,
    exercise: `**Exercise:** Check the category score for \`"harassment"\` in \`mod.category_scores\` and print whether it is under the safety threshold of \`0.05\`.`,
    hint: "Access `mod.category_scores[\"harassment\"]` and test `< 0.05`.",
    solution: `user_comment = "RubyLLM makes building AI features in Rails so much fun!"
mod = RubyLLM.moderate(user_comment)

score = mod.category_scores["harassment"]
puts "Harassment Score: #{score}"
if score < 0.05
  puts "Status: SAFE (Well below 0.05 threshold)"
else
  puts "Status: REVIEW REQUIRED"
end
`,
  },

  {
    id: "token-cost",
    category: "Search & Ops",
    title: "Usage & Cost Ledger",
    description: `
RubyLLM tracks token usage and dollar cost across every turn in a chat.

- \`chat.tokens.input\` and \`chat.tokens.output\` track token consumption.
- \`chat.cost\` calculates exact financial expenditure based on the model's catalog pricing.
    `.trim(),
    starterCode: `chat = RubyLLM.chat(model: "gpt-5.6-luna")

chat.ask "What is the time complexity of binary search?"
chat.ask "Explain how it compares to linear search."

puts "=== Conversation Accounting ==="
puts "Input tokens:  #{chat.tokens.input}"
puts "Output tokens: #{chat.tokens.output}"
puts "Total tokens:  #{chat.tokens.total}"
puts "Total cost:    #{chat.cost}"
`,
    exercise: `**Exercise:** Calculate the cost per 1,000 tokens for this run: \`(chat.cost.amount / chat.tokens.total) * 1000\`. Print the result.`,
    hint: "Use `(chat.cost.amount / chat.tokens.total) * 1000` to find cost per thousand tokens.",
    solution: `chat = RubyLLM.chat(model: "gpt-5.6-luna")

chat.ask "What is the time complexity of binary search?"
chat.ask "Explain how it compares to linear search."

cost_per_k = ((chat.cost.amount / chat.tokens.total) * 1000).round(6)

puts "Total Tokens: #{chat.tokens.total}"
puts "Total Cost:   #{chat.cost}"
puts "Cost per 1,000 tokens: $#{cost_per_k}"
`,
  },

  // =========================================================================
  // CATEGORY 6: Rails on the Web
  // =========================================================================
  {
    id: "rails-chat",
    category: "Rails on the Web",
    title: "Rails: acts_as_chat Active Record",
    description: `
In Ruby on Rails, RubyLLM integrates directly into your existing Active Record models using \`acts_as_chat\`!

Your application owns the \`Chat\` model. Adding \`acts_as_chat\` gives your model all the capabilities of \`RubyLLM::Chat\`, with full database persistence:

\`\`\`ruby
class Chat < ApplicationRecord
  acts_as_chat
end

chat = Chat.create!(model: "gemini-3.7-flash")
chat.ask "Explain Rails Active Record"
\`\`\`
    `.trim(),
    starterCode: `# In your Rails application (e.g. app/models/chat.rb):
class UserChat < ApplicationRecord
  acts_as_chat
end

# Create a persisted chat record in the database
chat = UserChat.create(model: "gemini-3.7-flash")

puts "Created Chat Record #ID: #{chat.id}"
puts "Model: #{chat.model}"
puts "Created at: #{chat.created_at}"

response = chat.ask "What are the benefits of acts_as_chat in Rails?"
puts "\\nAssistant response:"
puts response.content
`,
    exercise: `**Exercise:** Query \`UserChat.count\` and \`UserChat.all\` to verify that the chat was persisted to the database.`,
    hint: "Call `puts \"Total Chats: #{UserChat.count}\"` and iterate over `UserChat.all`.",
    solution: `class UserChat < ApplicationRecord
  acts_as_chat
end

chat = UserChat.create(model: "gemini-3.7-flash")
chat.ask "What are the benefits of acts_as_chat in Rails?"

puts "Database Verification:"
puts "Total UserChat rows in DB: #{UserChat.count}"
puts "First Chat model: #{UserChat.first.model}"
`,
  },

  {
    id: "rails-messages",
    category: "Rails on the Web",
    title: "Rails: acts_as_message Persistence",
    description: `
When you call \`chat.ask\` on an \`acts_as_chat\` record, RubyLLM automatically persists both the user prompt and the assistant response to the database as \`acts_as_message\` records!

\`\`\`ruby
class Message < ApplicationRecord
  acts_as_message
end
\`\`\`

You can access them via the standard Active Record relation: \`chat.messages\`.
    `.trim(),
    starterCode: `class SupportChat < ApplicationRecord
  acts_as_chat
end

chat = SupportChat.create(model: "gpt-5.6-luna")

chat.ask "My billing address changed."
chat.ask "Can you update it to San Francisco?"

puts "Persisted Messages for Chat ##{chat.id} (Total: #{chat.messages.count}):"
chat.messages.each do |msg|
  puts "[#{msg.role.upcase}] #{msg.content}"
end
`,
    exercise: `**Exercise:** Filter messages using the Active Record relation \`chat.messages.where(role: :user)\` and print only the user queries.`,
    hint: "Use `user_messages = chat.messages.where(role: :user)` and iterate with `each`.",
    solution: `class SupportChat < ApplicationRecord
  acts_as_chat
end

chat = SupportChat.create(model: "gpt-5.6-luna")
chat.ask "My billing address changed."
chat.ask "Can you update it to San Francisco?"

user_messages = chat.messages.where(role: :user)
puts "User Inquiries (#{user_messages.count}):"
user_messages.each do |msg|
  puts "-> #{msg.content}"
end
`,
  },

  {
    id: "rails-queries",
    category: "Rails on the Web",
    title: "Rails: Querying Chat History",
    description: `
Because chats and messages are native Active Record records, you can query, sort, and paginate them using standard Rails query methods!

\`\`\`ruby
# Query all chats
Chat.all

# Find recent messages
chat.messages.where(role: :assistant).last
\`\`\`
    `.trim(),
    starterCode: `class WorkspaceChat < ApplicationRecord
  acts_as_chat
end

chat1 = WorkspaceChat.create(model: "gpt-5.6-luna")
chat1.ask "Project planning kickoff"

chat2 = WorkspaceChat.create(model: "claude-3.7-sonnet")
chat2.ask "Database migration review"

puts "Total Active Record Chat records: #{WorkspaceChat.count}"
WorkspaceChat.all.each do |c|
  puts "Chat ##{c.id} (Model: #{c.model}): #{c.messages.first.content}"
end
`,
    exercise: `**Exercise:** Find the last message of \`chat2\` using \`chat2.messages.last\` and print its role and content.`,
    hint: "Call `last_msg = chat2.messages.last` and print `[#{last_msg.role}] #{last_msg.content}`.",
    solution: `class WorkspaceChat < ApplicationRecord
  acts_as_chat
end

chat1 = WorkspaceChat.create(model: "gpt-5.6-luna")
chat1.ask "Project planning kickoff"

chat2 = WorkspaceChat.create(model: "claude-3.7-sonnet")
chat2.ask "Database migration review"

last_msg = chat2.messages.last
puts "Last message of Chat #2:"
puts "[#{last_msg.role.to_s.upcase}] #{last_msg.content}"
`,
  },

  {
    id: "rails-ledger",
    category: "Rails on the Web",
    title: "Rails: Persisted Usage & Costs",
    description: `
RubyLLM automatically tracks tokens and cost across persisted Rails chats.

Calling \`chat.tokens\` and \`chat.cost\` aggregates usage directly from the chat's persisted messages and ledger:
\`\`\`ruby
chat.cost # => #<RubyLLM::Cost $0.001250 USD>
\`\`\`
    `.trim(),
    starterCode: `class EnterpriseChat < ApplicationRecord
  acts_as_chat
end

chat = EnterpriseChat.create(model: "gpt-5.6-luna")
chat.ask "Analyze security compliance policies."
chat.ask "Draft an executive summary."

puts "Active Record Chat Usage Telemetry:"
puts "Input tokens:  #{chat.tokens.input}"
puts "Output tokens: #{chat.tokens.output}"
puts "Total tokens:  #{chat.tokens.total}"
puts "Stored cost:   #{chat.cost}"
`,
    exercise: `**Exercise:** Check whether \`chat.cost.amount > 0\` and print an invoice line item with the amount.`,
    hint: "Check `if chat.cost.amount > 0` and print `\"Invoice item: #{chat.cost}\"`.",
    solution: `class EnterpriseChat < ApplicationRecord
  acts_as_chat
end

chat = EnterpriseChat.create(model: "gpt-5.6-luna")
chat.ask "Analyze security compliance policies."
chat.ask "Draft an executive summary."

if chat.cost.amount > 0
  puts "Invoice Line Item: #{chat.cost} for Chat Record ##{chat.id}"
end
`,
  },

  {
    id: "capstone",
    category: "Rails on the Web",
    title: "Full-Stack Production Workflow",
    description: `
In this final lesson, combine everything you've learned into a complete production workflow:
1. Define a specialized \`StockLookup\` tool.
2. Build an \`InvestmentAgent\` that uses the tool.
3. Persist the conversation in an Active Record \`Chat\` model.
4. Stream the results and print the final cost telemetry!
    `.trim(),
    starterCode: `# 1. Tool
class StockPrice < RubyLLM::Tool
  description "Fetch current stock price"
  param :symbol, type: :string, desc: "Stock ticker symbol"

  def execute(symbol:)
    { symbol: symbol.upcase, price: 185.42, change: "+1.8%" }
  end
end

# 2. Agent
class FinancialAdvisor < RubyLLM::Agent
  model "gpt-5.6-luna"
  instructions "You are a professional financial advisor. Always check real-time stock prices."
  tools StockPrice
end

# 3. Rails Persistence
class PortfolioChat < ApplicationRecord
  acts_as_chat
end

chat = PortfolioChat.create(model: "gpt-5.6-luna")
advisor = FinancialAdvisor.new

puts "=== Running Full-Stack Workflow ==="
response = advisor.ask "What is the current stock price of AAPL?"

puts response.content
puts "\\nTelemetry:"
puts "Chat ID: #{chat.id}"
puts "Tokens: #{advisor.chat.tokens}"
puts "Cost: #{advisor.chat.cost}"
`,
    exercise: `**Exercise:** Run the complete workflow! Modify the inquiry to check both "AAPL and MSFT" and verify the full execution.`,
    hint: "Update the prompt to `\"What is the current stock price of AAPL and MSFT?\"` and run.",
    solution: `class StockPrice < RubyLLM::Tool
  description "Fetch current stock price"
  param :symbol, type: :string, desc: "Stock ticker symbol"

  def execute(symbol:)
    { symbol: symbol.upcase, price: 185.42, change: "+1.8%" }
  end
end

class FinancialAdvisor < RubyLLM::Agent
  model "gpt-5.6-luna"
  instructions "You are a professional financial advisor. Always check real-time stock prices."
  tools StockPrice
end

class PortfolioChat < ApplicationRecord
  acts_as_chat
end

chat = PortfolioChat.create(model: "gpt-5.6-luna")
advisor = FinancialAdvisor.new

puts "=== Running Full-Stack Workflow ==="
response = advisor.ask "What is the current stock price of AAPL and MSFT?"

puts response.content
puts "\\nTelemetry:"
puts "Chat ID: #{chat.id}"
puts "Tokens: #{advisor.chat.tokens}"
puts "Cost: #{advisor.chat.cost}"
`,
  },
];
