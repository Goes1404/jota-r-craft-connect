import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ShoppingBag, 
  Search, 
  Package, 
  Truck, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Save,
  Save,
  User,
  Phone,
  Printer
import { useNavigate } from 'react-router-dom';

const AdminOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: async () => {
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, user:profiles(full_name, email, phone), items:order_items(quantity, total_price, unit_price, product:products(name))')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, tracking_code }: { id: string, status: string, tracking_code: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, tracking_code })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-orders'] });
      
      const orderUser = orders.find(o => o.id === variables.id)?.user;
      
      if (variables.status === 'Enviado' && variables.tracking_code && orderUser?.phone) {
        toast.success('Pedido atualizado! Deseja avisar o cliente?', {
          action: {
            label: 'Avisar no WhatsApp',
            onClick: () => {
              const text = `Olá ${orderUser.full_name?.split(' ')[0]}! O seu pedido da JR Acessórios foi enviado. 🚚\n\nSeu código de rastreio é: *${variables.tracking_code}*`;
              window.open(`https://wa.me/${orderUser.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
            }
          },
          duration: 10000
        });
      } else {
        toast.success('Pedido atualizado com sucesso!');
      }
      
      setEditingOrderId(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar pedido: ' + error.message);
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-orders'] });
      toast.success('Pedido removido.');
    }
  });

  const startEditing = (order: any) => {
    setEditingOrderId(order.id);
    setEditTrackingCode(order.tracking_code || '');
    setEditStatus(order.status || 'Pendente');
  };

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items?.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">${item.product?.name || 'Produto Removido'}</td>
        <td style="padding: 12px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right;">R$ ${Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('') || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #666; letter-spacing: 1px; margin-top: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .box { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
            h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 0; }
            p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px 0; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; }
            .total { margin-top: 30px; text-align: right; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">JR Acessórios</div>
            <div class="subtitle">Romaneio de Envio / Pedido #${order.id.slice(0, 8)}</div>
          </div>
          
          <div class="info-grid">
            <div class="box">
              <h3>Dados do Cliente</h3>
              <p><strong>Nome:</strong> ${order.user?.full_name || 'N/A'}</p>
              <p><strong>E-mail:</strong> ${order.user?.email || 'N/A'}</p>
              <p><strong>Telefone:</strong> ${order.user?.phone || 'N/A'}</p>
            </div>
            <div class="box">
              <h3>Detalhes do Pedido</h3>
              <p><strong>Data:</strong> ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Rastreio:</strong> ${order.tracking_code || 'Pendente'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th style="text-align: center;">Qtd</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total">
            Total do Pedido: R$ ${Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          
          <div style="margin-top: 60px; text-align: center; font-size: 12px; color: #666; border-top: 1px dashed #ccc; padding-top: 20px;">
            Obrigado por comprar na JR Acessórios!
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Entregue':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[9px] font-black tracking-widest">Entregue</Badge>;
      case 'Enviado':
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 uppercase text-[9px] font-black tracking-widest">Enviado</Badge>;
      case 'Pago':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[9px] font-black tracking-widest">✓ Pago</Badge>;
      case 'Aguardando Pagamento':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase text-[9px] font-black tracking-widest animate-pulse">Aguardando Pgto</Badge>;
      case 'Cancelado':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 uppercase text-[9px] font-black tracking-widest">Cancelado</Badge>;
      case 'Pendente':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase text-[9px] font-black tracking-widest">Pendente</Badge>;
      default:
        return <Badge className="bg-white/5 text-white/40 border-white/10 uppercase text-[9px] font-black tracking-widest">{status || 'Processando'}</Badge>;
    }
  };

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white/40 uppercase tracking-widest font-black">Acesso Restrito</p></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="text-white/40 hover:text-[#d4af37] transition-colors p-0">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Painel</span>
            </Button>
            <div className="h-6 w-[1px] bg-white/10"></div>
            <h1 className="text-xl font-serif font-black text-white uppercase tracking-[0.2em]">Gestão de <span className="text-[#d4af37]">Pedidos</span></h1>
          </div>
          
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder="Buscar por ID ou Nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 pl-10 rounded-full h-10 text-xs focus:border-[#d4af37]/40 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-8 py-12">
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-black/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]"><Package className="w-5 h-5" /></div>
              <h3 className="text-xl font-serif font-bold text-white">Pedidos da Loja Online</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{filteredOrders.length} Pedidos Ativos</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Data</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Cliente</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Valor</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Status</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Código de Rastreio</TableHead>
                  <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-20 animate-pulse bg-white/5"></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                    <TableCell className="py-6 px-8 text-xs font-bold text-white/40">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white uppercase tracking-tight">{order.user?.full_name || 'Anônimo'}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{order.user?.email || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-sm font-serif font-black text-[#d4af37]">
                      R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      {editingOrderId === order.id ? (
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger className="h-8 bg-black border-white/10 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/10 text-white">
                            <SelectItem value="Aguardando Pagamento">⏳ Aguardando Pagamento</SelectItem>
                            <SelectItem value="Pago">✅ Pago</SelectItem>
                            <SelectItem value="Pendente">📦 Pendente (Preparando)</SelectItem>
                            <SelectItem value="Enviado">🚚 Enviado</SelectItem>
                            <SelectItem value="Entregue">✓ Entregue</SelectItem>
                            <SelectItem value="Cancelado">❌ Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(order.status)
                      )}
                    </TableCell>
                    <TableCell className="py-6">
                      {editingOrderId === order.id ? (
                        <Input 
                          value={editTrackingCode}
                          onChange={(e) => setEditTrackingCode(e.target.value)}
                          placeholder="Ex: BR123456789"
                          className="h-8 bg-black border-white/10 text-xs"
                        />
                      ) : (
                        <span className="text-xs font-mono text-white/40">
                          {order.tracking_code || 'Não informado'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {order.user?.phone && (
                          <a 
                            href={`https://wa.me/${order.user.phone.replace(/\D/g, '')}?text=Olá ${order.user.full_name?.split(' ')[0]}, vi o seu pedido #${order.id.slice(0,6)} na loja.`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mr-2"
                          >
                            <Button size="sm" variant="ghost" className="text-[#25D366] hover:bg-[#25D366]/10 h-8 rounded-lg p-2">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {editingOrderId === order.id ? (
                          <Button 
                            onClick={() => updateOrderMutation.mutate({ id: order.id, status: editStatus, tracking_code: editTrackingCode })}
                            size="sm"
                            className="bg-[#d4af37] text-black h-8 rounded-lg"
                          >
                            <Save className="h-3.5 w-3.5 mr-1" /> Salvar
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => startEditing(order)}
                            variant="ghost"
                            size="sm"
                            className="text-white/20 hover:text-[#d4af37] hover:bg-[#d4af37]/5 h-8 rounded-lg"
                          >
                            Editar
                          </Button>
                        )}
                        <Button 
                          onClick={() => handlePrint(order)}
                          variant="ghost"
                          size="sm"
                          className="text-white/40 hover:text-white hover:bg-white/5 h-8 rounded-lg"
                          title="Imprimir Romaneio"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => { if(window.confirm('Excluir este pedido?')) deleteOrderMutation.mutate(order.id) }}
                          variant="ghost"
                          size="sm"
                          className="text-white/10 hover:text-red-500 hover:bg-red-500/5 h-8 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">LUMINA TECH — ORDER FULFILLMENT SYSTEMS</p>
      </footer>
    </div>
  );
};

export default AdminOrders;
