import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService, SaleFilter } from "@/services/salesService";
import { Sale } from "@/types/database";
import { toast } from "sonner";

export const useSales = (filter: SaleFilter = {}) => {
  return useQuery({
    queryKey: ["sales", filter],
    queryFn: () => salesService.getSales(filter),
  });
};

export const useSalesSummary = (filter: SaleFilter = {}) => {
  return useQuery({
    queryKey: ["sales-summary", filter],
    queryFn: () => salesService.getSalesSummary(filter),
  });
};

export const useSalesMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: salesService.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar venda: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: salesService.deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Venda removida com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover venda: " + error.message);
    },
  });

  return {
    createSale: createMutation.mutateAsync,
    deleteSale: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
