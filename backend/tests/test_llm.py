from app.generation.llm import OmniRouteLLM


llm = OmniRouteLLM()

response = llm.generate(
    "Explain Retrieval-Augmented Generation in one short paragraph."
)

print("\n--- OmniRoute Response ---")
print(response)