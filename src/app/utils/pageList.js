// Every list endpoint returns a page: { content, totalElements, totalPages, number, size }.
// Screens that only need a short list (dropdowns, pickers) use asList: it asks for the biggest
// page (100) and hands back a plain array in `data`; the page itself stays in `page`.
export const LIST_SIZE = 100;

export const rowsOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);

export const asList = (res) => ({ ...res, data: rowsOf(res?.data), page: res?.data });

export const listParams = (extra = {}) => ({ page: 0, size: LIST_SIZE, ...extra });

/**
 * Every row of a paged list, for pickers that must offer all items (for example "pick the
 * lesson for this exam"). Reads 100 rows per request, stops after `maxPages`.
 * fetchPage(params) -> axios response with a page.
 */
export async function fetchAllPages(fetchPage, params = {}, maxPages = 20) {
  const rows = [];
  for (let page = 0; page < maxPages; page++) {
    const { data } = await fetchPage({ ...params, page, size: LIST_SIZE });
    rows.push(...rowsOf(data));
    if (Array.isArray(data) || data?.last !== false || rowsOf(data).length < LIST_SIZE) break;
  }
  return rows;
}
