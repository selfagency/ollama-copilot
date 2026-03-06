---
# ollama-models-vscode-5cul
title: Library model collapsible variants with download children
status: in-progress
type: feature
branch: feat/5cul-library-collapsible-variants
created_at: 2026-03-06T16:00:08Z
updated_at: 2026-03-06T16:00:08Z
---

Library items show multiple model variants under them in a collapsible tree. Parent node shows the model name with a link button. Children show each downloadable variant (e.g., llama3.2:1b, llama3.2:3b) with a download button. Downloaded variants show a check icon. Variants are lazily fetched by scraping the model's library page HTML.

## Todo

- [ ] Add `library-model-variant` and `library-model-downloaded-variant` to ModelTreeItem type union
- [ ] Set library-model items to TreeItemCollapsibleState.Collapsed
- [ ] Filter variant-format names from parent list
- [ ] Add cachedLocalModelNames field + getCachedLocalModelNames() to LocalModelsProvider
- [ ] Add variantsCache + fetchModelVariants to LibraryModelsProvider
- [ ] Update getChildren to serve variant children
- [ ] Update handlePullModelFromLibrary guard to accept variant types
- [ ] Update package.json menus for new context values
- [ ] Wire getCachedLocalModelNames in registerSidebar
- [ ] Write and pass all tests
