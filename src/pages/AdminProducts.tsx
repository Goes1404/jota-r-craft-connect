import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MultiImageUpload from '@/components/MultiImageUpload';
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Package,
  DollarSign,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAdminProducts, useProductMutations } from '@/hooks/useProducts';
import { Product } from '@/types/database';

const AdminProducts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    description: '',
    detailed_description: '',
    image: '',
    images: [] as string[],
    category: '',
    stock: '',
    is_featured: false,
  });

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch products
  const { data: allProducts = [], isLoading } = useAdminProducts();
  
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  // Filter products
  const products = allProducts.filter(product => {
    const matchesName = product.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesCategory = !categoryFilter || product.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'available' && product.stock > 0) ||
      (statusFilter === 'out-of-stock' && product.stock === 0) ||
      (statusFilter === 'featured' && product.is_featured);
    
    return matchesName && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      cost: '',
      description: '',
      detailed_description: '',
      image: '',
      images: [],
      category: '',
      stock: '',
      is_featured: false,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost: product.cost?.toString() || '0',
      description: product.description || '',
      detailed_description: product.detailed_description || '',
      image: product.image,
      images: product.images || [product.image].filter(Boolean),
      category: product.category || '',
      stock: product.stock.toString(),
      is_featured: product.is_featured,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image && formData.images.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, faça o upload de uma imagem do produto.',
        variant: 'destructive',
      });
      return;
    }
    
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
      description: formData.description,
      detailed_description: formData.detailed_description,
      image: formData.image || formData.images[0],
      images: formData.images,
      category: formData.category,
      stock: parseInt(formData.stock),
      is_featured: formData.is_featured,
    };

    if (editingProduct) {
      await updateProduct({ id: editingProduct.id, product: productData });
    } else {
      await createProduct(productData);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduct(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:h-16 sm:py-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="self-start"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                Dashboard
              </Button>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-primary">
                Gerenciar Produtos
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct 
                      ? 'Atualize as informações do produto'
                      : 'Adicione um novo produto ao catálogo'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Produto</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="cost">Custo (R$)</Label>
                       <Input
                         id="cost"
                         type="number"
                         step="0.01"
                         value={formData.cost}
                         onChange={(e) => setFormData({...formData, cost: e.target.value})}
                         placeholder="0.00"
                       />
                     </div>
                     <div>
                       <Label htmlFor="category">Categoria</Label>
                       <Input
                         id="category"
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                         placeholder="Ex: colares, brincos, anéis"
                       />
                     </div>
                   </div>

                   <div>
                     <Label htmlFor="stock">Estoque</Label>
                     <Input
                       id="stock"
                       type="number"
                       value={formData.stock}
                       onChange={(e) => setFormData({...formData, stock: e.target.value})}
                       required
                     />
                   </div>

                   <MultiImageUpload
                     onImagesChange={(urls) => setFormData({...formData, images: urls})}
                     currentImages={formData.images}
                   />

                  <div>
                    <Label htmlFor="description">Descrição Curta</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="detailed_description">Descrição Detalhada</Label>
                    <Textarea
                      id="detailed_description"
                      value={formData.detailed_description}
                      onChange={(e) => setFormData({...formData, detailed_description: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    />
                    <Label htmlFor="is_featured">Produto em destaque</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-5 w-5" />
              Produtos Cadastrados ({products.length})
            </CardTitle>
            <CardDescription className="text-sm">
              Gerencie todos os produtos da sua loja
            </CardDescription>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="nameFilter" className="text-sm">Buscar por nome</Label>
                <Input
                  id="nameFilter"
                  placeholder="Digite o nome do produto..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="categoryFilter" className="text-sm">Filtrar por categoria</Label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="statusFilter" className="text-sm">Filtrar por status</Label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Todos os status</option>
                  <option value="available">Disponível</option>
                  <option value="out-of-stock">Esgotado</option>
                  <option value="featured">Em destaque</option>
                </select>
              </div>
            </div>

            {(nameFilter || categoryFilter || statusFilter !== 'all') && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNameFilter('');
                    setCategoryFilter('');
                    setStatusFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Produto</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead className="hidden sm:table-cell">Custo</TableHead>
                      <TableHead className="hidden md:table-cell">Estoque</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base truncate">{product.name}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground sm:hidden truncate">
                                {product.description?.substring(0, 30)}...
                              </div>
                              <div className="hidden sm:block text-sm text-muted-foreground">
                                {product.description?.substring(0, 50)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.category && (
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm sm:text-base">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">
                            R$ {(product.cost || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className={`flex items-center gap-2 ${product.stock < 5 ? 'text-amber-600 font-bold' : ''}`}>
                            {product.stock < 5 ? <AlertTriangle className="h-4 w-4" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
                            {product.stock}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            {product.is_featured && (
                              <Badge variant="default" className="text-xs">Destaque</Badge>
                            )}
                            <Badge variant={product.stock > 0 ? (product.stock < 5 ? "outline" : "default") : "destructive"} className={`text-xs ${product.stock > 0 && product.stock < 5 ? "border-amber-300 text-amber-600" : ""}`}>
                              {product.stock > 0 ? (product.stock < 5 ? 'Estoque Baixo' : 'Disponível') : 'Esgotado'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="p-1 sm:p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminProducts;