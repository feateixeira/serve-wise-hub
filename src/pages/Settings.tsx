import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings as SettingsIcon, Save, Building, User, Palette, Target } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  establishment_id: string;
}

interface Establishment {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  settings: any;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setPrimaryColor } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Load establishment data
        const { data: establishmentData } = await supabase
          .from("establishments")
          .select("*")
          .eq("id", profileData.establishment_id)
          .single();

        if (establishmentData) {
          setEstablishment(establishmentData);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.get("name") as string,
          email: formData.get("email") as string,
        })
        .eq("id", profile!.id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleEstablishmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    
    // Debug: Log all form data
    console.log("All form data entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const settings = {
        ...establishment?.settings,
        theme_color: formData.get("theme_color") as string,
        enable_notifications: formData.get("enable_notifications") === "on",
        tax_rate: parseFloat(formData.get("tax_rate") as string) || 0,
        delivery_fee: parseFloat(formData.get("delivery_fee") as string) || 0,
        delivery_free_threshold: parseFloat(formData.get("delivery_free_threshold") as string) || 0,
        // Metas do Dashboard
        daily_revenue_goal: parseFloat(formData.get("daily_revenue_goal") as string) || 0,
        monthly_revenue_goal: parseFloat(formData.get("monthly_revenue_goal") as string) || 0,
        monthly_orders_goal: parseInt(formData.get("monthly_orders_goal") as string) || 0,
        monthly_customers_goal: parseInt(formData.get("monthly_customers_goal") as string) || 0,
        monthly_sales_goal: parseFloat(formData.get("monthly_sales_goal") as string) || 0,
        daily_orders_goal: parseInt(formData.get("daily_orders_goal") as string) || 0,
      };

      // Get form values with fallbacks
      const establishmentName = formData.get("establishment_name") as string;
      const establishmentEmail = formData.get("establishment_email") as string;
      
      console.log("Raw form values:", { establishmentName, establishmentEmail });
      
      // Prepare the update data
      const updateData: any = {
        name: establishmentName || establishment?.name || "",
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        logo_url: (formData.get("logo_url") as string) || null,
        settings,
      };

      // Validate required fields
      if (!updateData.name || updateData.name.trim() === "") {
        toast.error("Nome do estabelecimento é obrigatório");
        return;
      }

      // Validate and update email
      const newEmail = (formData.get("establishment_email") as string) || establishment?.email || "";
      if (!newEmail || newEmail.trim() === "") {
        toast.error("Email do estabelecimento é obrigatório");
        return;
      }
      
      // Only update email if it's different from current email to avoid unique constraint issues
      if (newEmail !== establishment?.email) {
        updateData.email = newEmail;
      }

      console.log("Form data received:", {
        establishment_name: formData.get("establishment_name"),
        establishment_email: formData.get("establishment_email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        logo_url: formData.get("logo_url")
      });
      
      console.log("Updating establishment with data:", updateData);

      const { error } = await supabase
        .from("establishments")
        .update(updateData)
        .eq("id", establishment!.id);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      // Apply theme color immediately
      const themeColor = formData.get("theme_color") as string;
      if (themeColor) {
        setPrimaryColor(themeColor);
      }
      
      toast.success("Estabelecimento atualizado com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error updating establishment:", error);
      toast.error("Erro ao atualizar estabelecimento: " + (error as any)?.message || "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <SettingsIcon className="mr-3 h-8 w-8" />
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Perfil do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={profile?.name || ""}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={profile?.email || ""}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input
                      id="role"
                      value={profile?.role || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <Button type="submit" disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Establishment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Estabelecimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEstablishmentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="establishment_name">Nome do Estabelecimento *</Label>
                    <Input
                      id="establishment_name"
                      name="establishment_name"
                      defaultValue={establishment?.name || ""}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="establishment_email">Email do Estabelecimento *</Label>
                    <Input
                      id="establishment_email"
                      name="establishment_email"
                      type="email"
                      defaultValue={establishment?.email || ""}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={establishment?.phone || ""}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={establishment?.address || ""}
                      rows={3}
                    />
                  </div>
                  
                  <Button type="submit" disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar Estabelecimento"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Configurações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEstablishmentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme_color">Cor do Tema</Label>
                      <Input
                        id="theme_color"
                        name="theme_color"
                        type="color"
                        defaultValue={establishment?.settings?.theme_color || "#000000"}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
                      <Input
                        id="tax_rate"
                        name="tax_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        defaultValue={establishment?.settings?.tax_rate || ""}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_fee">Valor da Entrega (R$)</Label>
                      <Input
                        id="delivery_fee"
                        name="delivery_fee"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={establishment?.settings?.delivery_fee || ""}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="delivery_free_threshold">Pedido mínimo para entrega grátis (R$)</Label>
                      <Input
                        id="delivery_free_threshold"
                        name="delivery_free_threshold"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={establishment?.settings?.delivery_free_threshold || ""}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Metas do Dashboard */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Metas do Dashboard
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="daily_revenue_goal">Meta de Faturamento Diário (R$)</Label>
                        <Input
                          id="daily_revenue_goal"
                          name="daily_revenue_goal"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={establishment?.settings?.daily_revenue_goal || ""}
                          placeholder="1000.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="monthly_revenue_goal">Meta de Faturamento Mensal (R$)</Label>
                        <Input
                          id="monthly_revenue_goal"
                          name="monthly_revenue_goal"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={establishment?.settings?.monthly_revenue_goal || ""}
                          placeholder="30000.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="monthly_orders_goal">Meta de Pedidos Mensais</Label>
                        <Input
                          id="monthly_orders_goal"
                          name="monthly_orders_goal"
                          type="number"
                          min="0"
                          defaultValue={establishment?.settings?.monthly_orders_goal || ""}
                          placeholder="300"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="monthly_customers_goal">Meta de Novos Clientes Mensais</Label>
                        <Input
                          id="monthly_customers_goal"
                          name="monthly_customers_goal"
                          type="number"
                          min="0"
                          defaultValue={establishment?.settings?.monthly_customers_goal || ""}
                          placeholder="50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="monthly_sales_goal">Meta de Vendas Mensais (R$)</Label>
                        <Input
                          id="monthly_sales_goal"
                          name="monthly_sales_goal"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={establishment?.settings?.monthly_sales_goal || ""}
                          placeholder="15000.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="daily_orders_goal">Meta de Pedidos Diários</Label>
                        <Input
                          id="daily_orders_goal"
                          name="daily_orders_goal"
                          type="number"
                          min="0"
                          defaultValue={establishment?.settings?.daily_orders_goal || ""}
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      name="logo_url"
                      type="url"
                      defaultValue={establishment?.logo_url || ""}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enable_notifications"
                      name="enable_notifications"
                      defaultChecked={establishment?.settings?.enable_notifications || false}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="enable_notifications">Habilitar notificações</Label>
                  </div>
                  
                  <Button type="submit" disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;