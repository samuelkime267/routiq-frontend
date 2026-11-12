"use client";

import { marketplaceApi } from "@/lib/api";
import type {
  MarketplaceCategoryDetailResult,
  MarketplaceCategoryListResult,
  MarketplaceCategoryProductsResult,
  MarketplaceCategoryQuery,
  MarketplaceFeaturedStoreListResult,
  MarketplaceProductDetailResult,
  MarketplaceProductListResult,
  MarketplaceProductQuery,
  MarketplaceRankedProductListResult,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  MarketplaceStoreDetailResult,
  MarketplaceStoreListResult,
  MarketplaceStoreProductsResult,
  MarketplaceStoreQuery,
} from "@/types/api";
import { useKeyedResource } from "./useKeyedResource";
import { useResource } from "./useResource";

const PRODUCT_ERROR = "We could not load products. Please try again.";
const STORE_ERROR = "We could not load stores. Please try again.";
const CATEGORY_ERROR = "We could not load categories. Please try again.";

/** Stable descriptor so changing an unrelated field does not trigger a load. */
function queryKey(query: unknown) {
  return JSON.stringify(query ?? {});
}

export function useMarketplaceProducts(query: MarketplaceProductQuery = {}) {
  return useKeyedResource<MarketplaceProductListResult>(
    queryKey(query),
    () => marketplaceApi.products(query),
    PRODUCT_ERROR,
  );
}

export function useMarketplaceProduct(productId: string) {
  return useResource<MarketplaceProductDetailResult>(
    productId,
    () => marketplaceApi.product(productId),
    "We could not load this product. Please try again.",
  );
}

export function useFeaturedProducts(query: MarketplaceProductQuery = {}) {
  return useKeyedResource<MarketplaceProductListResult>(
    queryKey(query),
    () => marketplaceApi.featuredProducts(query),
    PRODUCT_ERROR,
  );
}

export function usePopularProducts(query: MarketplaceProductQuery = {}) {
  return useKeyedResource<MarketplaceRankedProductListResult>(
    queryKey(query),
    () => marketplaceApi.popularProducts(query),
    PRODUCT_ERROR,
  );
}

export function useTrendingProducts(query: MarketplaceProductQuery = {}) {
  return useKeyedResource<MarketplaceRankedProductListResult>(
    queryKey(query),
    () => marketplaceApi.trendingProducts(query),
    PRODUCT_ERROR,
  );
}

export function useNewArrivals(query: MarketplaceProductQuery = {}) {
  return useKeyedResource<MarketplaceProductListResult>(
    queryKey(query),
    () => marketplaceApi.newArrivals(query),
    PRODUCT_ERROR,
  );
}

export function useOnSaleProducts(query: MarketplaceProductQuery = {}) {
  return useKeyedResource<MarketplaceProductListResult>(
    queryKey(query),
    () => marketplaceApi.onSale(query),
    PRODUCT_ERROR,
  );
}

export function useMarketplaceCategories(
  query: MarketplaceCategoryQuery = {},
) {
  return useKeyedResource<MarketplaceCategoryListResult>(
    queryKey(query),
    () => marketplaceApi.categories(query),
    CATEGORY_ERROR,
  );
}

export function useMarketplaceCategory(categoryId: string) {
  return useResource<MarketplaceCategoryDetailResult>(
    categoryId,
    () => marketplaceApi.category(categoryId),
    CATEGORY_ERROR,
  );
}

export function useMarketplaceCategoryProducts(
  categoryId: string,
  query: MarketplaceProductQuery = {},
) {
  return useKeyedResource<MarketplaceCategoryProductsResult>(
    `${categoryId}:${queryKey(query)}`,
    () => marketplaceApi.categoryProducts(categoryId, query),
    PRODUCT_ERROR,
  );
}

export function useMarketplaceStores(query: MarketplaceStoreQuery = {}) {
  return useKeyedResource<MarketplaceStoreListResult>(
    queryKey(query),
    () => marketplaceApi.stores(query),
    STORE_ERROR,
  );
}

export function useMarketplaceStore(storeId: string) {
  return useResource<MarketplaceStoreDetailResult>(
    storeId,
    () => marketplaceApi.store(storeId),
    "We could not load this store. Please try again.",
  );
}

export function useFeaturedStores(query: MarketplaceStoreQuery = {}) {
  return useKeyedResource<MarketplaceFeaturedStoreListResult>(
    queryKey(query),
    () => marketplaceApi.featuredStores(query),
    STORE_ERROR,
  );
}

export function useMarketplaceStoreProducts(
  storeId: string,
  query: MarketplaceProductQuery = {},
) {
  return useKeyedResource<MarketplaceStoreProductsResult>(
    `${storeId}:${queryKey(query)}`,
    () => marketplaceApi.storeProducts(storeId, query),
    PRODUCT_ERROR,
  );
}

const EMPTY_SEARCH: MarketplaceSearchResult = {
  query: "",
  type: "all",
  category: null,
  sortBy: "relevance",
};

/**
 * Debounce the term at the call site (`useDebouncedValue`) before passing it
 * here. An empty term never hits the API.
 */
export function useMarketplaceSearch(query: MarketplaceSearchQuery) {
  const term = (query.query ?? query.q ?? "").trim();
  const enabled = term.length > 0;

  const resource = useKeyedResource<MarketplaceSearchResult>(
    `${enabled ? "search" : "idle"}:${queryKey(query)}`,
    () =>
      enabled
        ? marketplaceApi.search({ ...query, query: term })
        : Promise.resolve(EMPTY_SEARCH),
    "We could not run this search. Please try again.",
  );

  return { ...resource, enabled };
}
