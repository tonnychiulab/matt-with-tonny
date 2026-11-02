# Separate Project Context Scanning from Pure Rule Evaluation

We decided to decouple environment I/O (scanning filesystem, git configuration, and CLI status) from rule evaluation by gathering all inspection data upfront into an immutable `ProjectContext` object.

Rules are pure functions that evaluate `ProjectContext` without performing filesystem or network I/O, trading upfront collection time for 100% deterministic, instant unit testing without mocking `fs` or child processes.
