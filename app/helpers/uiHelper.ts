// helpers/uiHelper.ts
export const getLeftMargin = (isExpanded: boolean, isPinned: boolean) => {
  return isExpanded || isPinned ? "md:ml-64" : "md:ml-16"
}