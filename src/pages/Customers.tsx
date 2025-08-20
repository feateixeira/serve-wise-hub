import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, UserPlus, Crown } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  discount_percentage: number;
  discount_amount: number;
  benefits: any;
  active: boolean;
}

interface CustomerWithGroups extends Customer {
  groups: CustomerGroup[];
}

const Customers = () => {
  const [customers, setCustomers] = useState<CustomerWithGroups[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("establishment_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.establishment_id) return;
      
      setEstablishmentId(profile.establishment_id);

      // Load all customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .eq("establishment_id", profile.establishment_id)
        .order("name");

      // Load all groups
      const { data: groupsData } = await supabase
        .from("customer_groups")
        .select("*")
        .eq("establishment_id", profile.establishment_id)
        .order("name");

      // Load customer-group relationships
      let customerGroupsData = [];
      if (customersData && customersData.length > 0) {
        const { data: cgmData } = await supabase
          .from("customer_group_members")
          .select(`
            customer_id,
            group_id,
            customer_groups(*)
          `)
          .in("customer_id", customersData.map(c => c.id));
        
        customerGroupsData = cgmData || [];
      }

      // Create a map of customer groups
      const customerGroupsMap = new Map();
      customerGroupsData?.forEach((item: any) => {
        if (!customerGroupsMap.has(item.customer_id)) {
          customerGroupsMap.set(item.customer_id, []);
        }
        customerGroupsMap.get(item.customer_id).push(item.customer_groups);
      });

      // Combine and format customers
      const formattedCustomers: CustomerWithGroups[] = customersData?.map(customer => ({
        ...customer,
        groups: customerGroupsMap.get(customer.id) || []
      })) || [];

      setCustomers(formattedCustomers);
      setGroups(groupsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    const formData = new FormData(e.currentTarget);

    const customerData = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      establishment_id: establishmentId,
    };

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingCustomer.id);

        if (error) throw error;
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("customers")
          .insert(customerData);

        if (error) throw error;
        toast.success("Cliente criado com sucesso!");
      }

      setIsCustomerDialogOpen(false);
      setEditingCustomer(null);
      loadData();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    const formData = new FormData(e.currentTarget);

    const groupData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      discount_percentage: parseFloat(formData.get("discount_percentage") as string) || 0,
      discount_amount: parseFloat(formData.get("discount_amount") as string) || 0,
      establishment_id: establishmentId,
      active: true
    };

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("customer_groups")
          .update(groupData)
          .eq("id", editingGroup.id);

        if (error) throw error;
        toast.success("Grupo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("customer_groups")
          .insert(groupData);

        if (error) throw error;
        toast.success("Grupo criado com sucesso!");
      }

      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      loadData();
    } catch (error) {
      console.error("Error saving group:", error);
      toast.error("Erro ao salvar grupo");
    }
  };

  const addCustomerToGroup = async (customerId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from("customer_group_members")
        .insert({
          customer_id: customerId,
          group_id: groupId
        });

      if (error) throw error;
      toast.success("Cliente adicionado ao grupo!");
      loadData();
    } catch (error) {
      console.error("Error adding customer to group:", error);
      toast.error("Erro ao adicionar cliente ao grupo");
    }
  };

  const removeCustomerFromGroup = async (customerId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from("customer_group_members")
        .delete()
        .eq("customer_id", customerId)
        .eq("group_id", groupId);

      if (error) throw error;
      toast.success("Cliente removido do grupo!");
      loadData();
    } catch (error) {
      console.error("Error removing customer from group:", error);
      toast.error("Erro ao remover cliente do grupo");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <div className="flex gap-2">
              <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCustomer(null)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingCustomer?.name || ""}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={editingCustomer?.phone || ""}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Textarea
                        id="address"
                        name="address"
                        defaultValue={editingCustomer?.address || ""}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingCustomer ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setEditingGroup(null)}>
                    <Crown className="mr-2 h-4 w-4" />
                    Novo Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingGroup ? "Editar Grupo" : "Novo Grupo"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGroupSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Nome do Grupo *</Label>
                      <Input
                        id="group-name"
                        name="name"
                        defaultValue={editingGroup?.name || ""}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Descrição</Label>
                      <Textarea
                        id="group-description"
                        name="description"
                        defaultValue={editingGroup?.description || ""}
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount-percentage">Desconto (%)</Label>
                        <Input
                          id="discount-percentage"
                          name="discount_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          defaultValue={editingGroup?.discount_percentage || ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="discount-amount">Desconto (R$)</Label>
                        <Input
                          id="discount-amount"
                          name="discount_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={editingGroup?.discount_amount || ""}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingGroup ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {groups.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Grupos de Clientes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {groups.map((group) => {
                  const groupMembers = customers.filter(customer => 
                    customer.groups.some(g => g.id === group.id)
                  );
                  
                  return (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                              <h3 className="font-medium text-sm">{group.name}</h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {groupMembers.length}
                            </Badge>
                          </div>
                          
                          {group.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {group.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1">
                            {group.discount_percentage > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {group.discount_percentage}%
                              </Badge>
                            )}
                            {group.discount_amount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                R$ {group.discount_amount.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          
                          {groupMembers.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Clientes:</p>
                              <div className="flex flex-wrap gap-1">
                                {groupMembers.slice(0, 2).map((member) => (
                                  <Badge key={member.id} variant="outline" className="text-xs">
                                    {member.name.split(' ')[0]}
                                  </Badge>
                                ))}
                                {groupMembers.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{groupMembers.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => {
                              setEditingGroup(group);
                              setIsGroupDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-base leading-tight">{customer.name}</h3>
                      <div className="space-y-1 mt-2">
                        {customer.phone && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            📞 {customer.phone}
                          </p>
                        )}
                        
                        {customer.address && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            📍 {customer.address}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {customer.groups.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {customer.groups.map((group) => (
                          <Badge 
                            key={group.id} 
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeCustomerFromGroup(customer.id, group.id)}
                            title="Clique para remover do grupo"
                          >
                            {group.name} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Select
                        onValueChange={(groupId) => addCustomerToGroup(customer.id, groupId)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="+ Grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups
                            .filter(group => !customer.groups.some(cg => cg.id === group.id))
                            .map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsCustomerDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {customers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro cliente para organizar sua carteira.
                </p>
                <Button onClick={() => setIsCustomerDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Primeiro Cliente
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Customers;