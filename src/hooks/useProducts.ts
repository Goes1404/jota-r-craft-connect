import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { Product } from "@/types/database";
import { toast } from "sonner";

// staleTime evita refetch a cada foco de janela/navegação — as mutations já
// invalidam o cache quando algo muda, então os dados nunca ficam defasados.
const PRODUCTS_STALE_TIME = 60 * 1000;

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
    staleTime: PRODUCTS_STALE_TIME,
  });
};

export const useAdminProducts = () => {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: productService.getAdminProducts,
    staleTime: PRODUCTS_STALE_TIME,
  });
};

export const useFeaturedProducts = (limit = 4) => {
  return useQuery({
    queryKey: ["featured-products", limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: PRODUCTS_STALE_TIME,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
};

export const useAppSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: productService.getAppSettings,
  });
};

export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar produto: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      productService.updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir produto: " + error.message);
    },
  });

  return {
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
