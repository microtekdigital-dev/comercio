"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getCustomer, updateCustomer, deleteCustomer,
  getCustomerAccountMovements, getCustomerBalance,
  getCustomerSales, getCustomerQuotes, getCustomerReturns,
} from "@/lib/actions/customers";
import { getCustomerRepairHistory } from "@/lib/actions/repair-orders";
import { getUserPermissions } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, Wrench, ExternalLink, ShoppingCart, FileText, RotateCcw, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer, RepairOrder } from "@/lib/types/erp";

const REPAIR_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  received: { label: 'Recibido', variant: 'secondary' },
  diagnosing: { label: 'En Diagnóstico', variant: 'default' },
  waiting_parts: { label: 'Esperando Repuestos', variant: 'secondary' },
  repairing: { label: 'En Reparación', variant: 'default' },
  repaired: { label: 'Reparado', variant: 'default' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const SALE_PAYMENT_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  paid: { label: 'Pagado', variant: 'default' },
  partial: { label: 'Parcial', variant: 'secondary' },
  pending: { label: 'Pendiente', variant: 'destructive' },
};

const QUOTE_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  sent: { label: 'Enviado', variant: 'default' },
  accepted: { label: 'Aceptado', variant: 'default' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
  expired: { label: 'Vencido', variant: 'destructive' },
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [canDelete, setCanDelete] = useState(false);

  // Summary stats
  const [balance, setBalance] = useState(0);
  const [salesStats, setSalesStats] = useState({ total: 0, count: 0, lastDate: null as string | null });

  // Tab data
  const [repairs, setRepairs] = useState<RepairOrder[]>([]);
  const [repairStats, setRepairStats] = useState({ totalRepairs: 0, totalAmount: 0, activeRepairs: 0 });
  const [sales, setSales] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  // Loading states per tab
  const [loadingTab, setLoadingTab] = useState<Record<string, boolean>>({});
  // Track which tabs have already been loaded
  const [loadedTab, setLoadedTab] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document_type: "DNI", document_number: "",
    address: "", city: "", state: "", country: "Argentina", postal_code: "", notes: "",
    status: "active" as "active" | "inactive" | "blocked",
  });

  useEffect(() => {
    loadCustomer();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanDelete(permissions.canDeleteCustomers);
  };

  const loadCustomer = async () => {
    const data = await getCustomer(id);
    if (data) {
      setCustomer(data);
      setFormData({
        name: data.name, email: data.email || "", phone: data.phone || "",
        document_type: data.document_type || "DNI", document_number: data.document_number || "",
        address: data.address || "", city: data.city || "", state: data.state || "",
        country: data.country, postal_code: data.postal_code || "",
        notes: data.notes || "", status: data.status,
      });
      // Load summary stats in background — don't block render
      getCustomerBalance(id).then(setBalance).catch(() => {});
      getCustomerSales(id).then(s => setSalesStats(s.stats)).catch(() => {});
    } else {
      toast.error("Cliente no encontrado");
      router.push("/dashboard/customers");
    }
  };

  const loadTab = async (tab: string) => {
    if (loadingTab[tab] || loadedTab[tab]) return;
    setLoadingTab(prev => ({ ...prev, [tab]: true }));
    try {
      if (tab === "repairs") {
        const h = await getCustomerRepairHistory(id);
        setRepairs(h.repairs);
        setRepairStats(h.stats);
      } else if (tab === "sales") {
        const s = await getCustomerSales(id);
        setSales(s.sales);
      } else if (tab === "quotes") {
        const q = await getCustomerQuotes(id);
        setQuotes(q);
      } else if (tab === "returns") {
        const r = await getCustomerReturns(id);
        setReturns(r);
      } else if (tab === "account") {
        const m = await getCustomerAccountMovements(id);
        setMovements(m);
      }
      setLoadedTab(prev => ({ ...prev, [tab]: true }));
    } finally {
      setLoadingTab(prev => ({ ...prev, [tab]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateCustomer(id, formData);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Cliente actualizado"); router.push("/dashboard/customers"); router.refresh(); }
    } catch { toast.error("Error al actualizar el cliente"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteCustomer(id);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Cliente eliminado"); router.push("/dashboard/customers"); router.refresh(); }
    } catch { toast.error("Error al eliminar el cliente"); }
    finally { setLoading(false); }
  };

  if (!customer) return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            <div className="h-7 w-32 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
            <p className="text-muted-foreground">{customer.email || customer.phone || "Sin contacto"}</p>
          </div>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Total comprado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(salesStats.total)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{salesStats.count} ventas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CreditCard className="h-3 w-3" />Deuda pendiente</CardDescription>
            <CardTitle className={`text-2xl ${balance > 0 ? "text-destructive" : ""}`}>{formatCurrency(balance)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{balance > 0 ? "Saldo a cobrar" : "Sin deuda"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Última operación</CardDescription>
            <CardTitle className="text-lg">{salesStats.lastDate ? formatDate(salesStats.lastDate) : "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estado</CardDescription>
            <CardTitle className="text-lg capitalize">{customer.status === "active" ? "Activo" : customer.status === "inactive" ? "Inactivo" : "Bloqueado"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6" onValueChange={loadTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="sales"><ShoppingCart className="h-4 w-4 mr-1" />Ventas</TabsTrigger>
          <TabsTrigger value="quotes"><FileText className="h-4 w-4 mr-1" />Presupuestos</TabsTrigger>
          <TabsTrigger value="repairs"><Wrench className="h-4 w-4 mr-1" />Reparaciones</TabsTrigger>
          <TabsTrigger value="returns"><RotateCcw className="h-4 w-4 mr-1" />Devoluciones</TabsTrigger>
          <TabsTrigger value="account"><CreditCard className="h-4 w-4 mr-1" />Cuenta Corriente</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo <span className="text-destructive">*</span></Label>
                      <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="blocked">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Documento</Label>
                      <Select value={formData.document_type} onValueChange={v => setFormData({ ...formData, document_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CUIT">CUIT</SelectItem>
                          <SelectItem value="CUIL">CUIL</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document_number">Número de Documento</Label>
                      <Input id="document_number" value={formData.document_number} onChange={e => setFormData({ ...formData, document_number: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Dirección</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Dirección" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input placeholder="Ciudad" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    <Input placeholder="Provincia" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                    <Input placeholder="Código Postal" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} />
                  </div>
                  <Input placeholder="País" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={4} />
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Link href="/dashboard/customers"><Button type="button" variant="outline">Cancelar</Button></Link>
              <Button type="submit" disabled={loading}><Save className="mr-2 h-4 w-4" />{loading ? "Guardando..." : "Guardar Cambios"}</Button>
            </div>
          </form>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>{salesStats.count} ventas · Total {formatCurrency(salesStats.total)}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTab.sales ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : sales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay ventas registradas</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Venta</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado Pago</TableHead>
                      <TableHead className="text-right">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map(sale => {
                      const ps = SALE_PAYMENT_STATUS[sale.payment_status] || SALE_PAYMENT_STATUS.pending;
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">#{sale.sale_number}</TableCell>
                          <TableCell>{formatDate(sale.sale_date)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                          <TableCell><Badge variant={ps.variant}>{ps.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/sales/${sale.id}`}>
                              <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Historial de Presupuestos</CardTitle></CardHeader>
            <CardContent>
              {loadingTab.quotes ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay presupuestos registrados</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Presupuesto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map(q => {
                      const qs = QUOTE_STATUS[q.status] || QUOTE_STATUS.draft;
                      return (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium">#{q.quote_number}</TableCell>
                          <TableCell>{formatDate(q.created_at)}</TableCell>
                          <TableCell>{q.valid_until ? formatDate(q.valid_until) : "—"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(q.total)}</TableCell>
                          <TableCell><Badge variant={qs.variant}>{qs.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/quotes/${q.id}`}>
                              <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repairs Tab */}
        <TabsContent value="repairs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-3"><CardDescription>Total Reparaciones</CardDescription><CardTitle className="text-3xl">{repairStats.totalRepairs}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>Monto Total</CardDescription><CardTitle className="text-3xl">{formatCurrency(repairStats.totalAmount)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-3"><CardDescription>Activas</CardDescription><CardTitle className="text-3xl">{repairStats.activeRepairs}</CardTitle></CardHeader></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Historial de Reparaciones</CardTitle></CardHeader>
            <CardContent>
              {loadingTab.repairs ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : repairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay reparaciones registradas</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden N°</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairs.map(r => {
                      const rs = REPAIR_STATUS[r.status] || REPAIR_STATUS.received;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">#{r.order_number}</TableCell>
                          <TableCell>{formatDate(r.received_date)}</TableCell>
                          <TableCell>{r.device_type} {r.brand} {r.model}</TableCell>
                          <TableCell><Badge variant={rs.variant}>{rs.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/repairs/${r.id}`}>
                              <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Historial de Devoluciones</CardTitle></CardHeader>
            <CardContent>
              {loadingTab.returns ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : returns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay devoluciones registradas</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Devolución</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Venta Original</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Reembolso</TableHead>
                      <TableHead className="text-right">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">#{r.return_number}</TableCell>
                        <TableCell>{formatDate(r.return_date)}</TableCell>
                        <TableCell>{r.original_sale?.sale_number ? `#${r.original_sale.sale_number}` : "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.reason || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.total_refund)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/returns/${r.id}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cuenta Corriente</CardTitle>
              <CardDescription>
                Saldo actual: <span className={balance > 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"}>{formatCurrency(balance)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTab.account ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay movimientos registrados</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>{formatDate(m.date)}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'sale' ? 'secondary' : 'default'}>
                            {m.type === 'sale' ? 'Venta' : 'Pago'}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.reference}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell className="text-right">{m.debit > 0 ? formatCurrency(m.debit) : "—"}</TableCell>
                        <TableCell className="text-right">{m.credit > 0 ? formatCurrency(m.credit) : "—"}</TableCell>
                        <TableCell className={`text-right font-medium ${m.balance > 0 ? "text-destructive" : ""}`}>{formatCurrency(m.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
