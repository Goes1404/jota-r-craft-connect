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

  // Lote (lançamento por foto): mesmas invalidações, um toast só.
  const createBatchMutation = useMutation({
    mutationFn: salesService.createSales,
    onSuccess: (rows) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      const n = rows?.length ?? 0;
      toast.success(`${n} ${n === 1 ? 'venda registrada' : 'vendas registradas'} a partir da foto!`);
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar vendas: " + error.message);
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
    createSales: createBatchMutation.mutateAsync,
    deleteSale: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCreatingBatch: createBatchMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
