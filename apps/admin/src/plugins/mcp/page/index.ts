import { createPageDraftTool } from "./createDraft"
import { publishPageTool } from "./publish"
import { replacePageStructureTool } from "./replaceStructure"
import { updatePageSeoTool } from "./updateSeo"

export const pageTools = [
	createPageDraftTool,
	replacePageStructureTool,
	updatePageSeoTool,
	publishPageTool,
]
