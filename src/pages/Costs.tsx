import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Calculator, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  Package,
  BarChart3,
  PieChart,
  Download,
  Target
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface FixedCost {
  id: string;
  name: string;
  description?: string;
  amount: number;
  start_date: string;
  recurrence: 'monthly' | 'annual' | 'one_time';
  active: boolean;
}

interface VariableCost {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  total_cost: number;
  unit_cost: number;
  unit_measure: string;
  supplier?: string;
  purchase_date: string;
  expiry_date?: string;
  active: boolean;
}

interface ProductIngredient {
  id: string;
  product_id: string;
  variable_cost_id: string;
  quantity_used: number;
  unit_cost_at_time: number;
  total_cost: number;
  product_name?: string;
  ingredient_name?: string;
}

interface CostAnalysis {
  id: string;
  period_start: string;
  period_end: string;
  total_fixed_costs: number;
  total_variable_costs: number;
  total_products_sold: number;
  average_cost_per_product: number;
  profit_margin_percentage: number;
  suggested_price_multiplier: number;
}

const Costs = () => {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [profitMargin, setProfitMargin] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const { setPrimaryColor } = useTheme();

  // Form states
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [editingVariableCost, setEditingVariableCost] = useState<VariableCost | null>(null);
  const [editingProductIngredient, setEditingProductIngredient] = useState<ProductIngredient | null>(null);
  // Controlled values for non-native Selects (so FormData captures via hidden inputs)
  const [fixedCostRecurrence, setFixedCostRecurrence] = useState<'monthly' | 'annual' | 'one_time'>('monthly');
  const [variableUnitMeasure, setVariableUnitMeasure] = useState<string>('unidade');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');

  const parseNumber = (value: FormDataEntryValue | null) => {
    const str = (value ?? '').toString().trim();
    if (!str) return 0;
    // Normaliza formatos como "1.234,56" ou "1234,56" para 1234.56
    const normalized = str.replace(/\./g, '').replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user profile to get establishment_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("establishment_id")
        .eq("user_id", session.user.id)
        .single();

      if (profileData?.establishment_id) {
        setEstablishmentId(profileData.establishment_id);
        await Promise.all([
          loadFixedCosts(profileData.establishment_id),
          loadVariableCosts(profileData.establishment_id),
          loadProductIngredients(profileData.establishment_id),
          loadCostAnalysis(profileData.establishment_id),
          loadProducts(profileData.establishment_id)
        ]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Sync Select controlled values when entering/leaving edit modes
  useEffect(() => {
    if (editingFixedCost) {
      setFixedCostRecurrence(editingFixedCost.recurrence);
    } else {
      setFixedCostRecurrence('monthly');
    }
  }, [editingFixedCost]);

  useEffect(() => {
    if (editingVariableCost) {
      setVariableUnitMeasure(editingVariableCost.unit_measure);
    } else {
      setVariableUnitMeasure('unidade');
    }
  }, [editingVariableCost]);

  useEffect(() => {
    if (editingProductIngredient) {
      setSelectedProductId(editingProductIngredient.product_id);
      setSelectedIngredientId(editingProductIngredient.variable_cost_id);
    } else {
      setSelectedProductId('');
      setSelectedIngredientId('');
    }
  }, [editingProductIngredient]);

  const loadFixedCosts = async (estId: string) => {
    const { data, error } = await supabase
      .from("fixed_costs")
      .select("*")
      .eq("establishment_id", estId)
      .eq("active", true)
      .order("name");

    if (error) throw error;
    setFixedCosts(data || []);
  };

  const loadVariableCosts = async (estId: string) => {
    const { data, error } = await supabase
      .from("variable_costs")
      .select("*")
      .eq("establishment_id", estId)
      .eq("active", true)
      .order("name");

    if (error) throw error;
    setVariableCosts(data || []);
  };

  const loadProductIngredients = async (estId: string) => {
    const { data, error } = await supabase
      .from("product_ingredients")
      .select(`
        *,
        products(name),
        variable_costs(name)
      `)
      .eq("products.establishment_id", estId);

    if (error) throw error;
    
    const formattedData = data?.map(item => ({
      ...item,
      product_name: item.products?.name,
      ingredient_name: item.variable_costs?.name
    })) || [];
    
    setProductIngredients(formattedData);
  };

  const loadCostAnalysis = async (estId: string) => {
    const { data, error } = await supabase
      .from("cost_analysis")
      .select("*")
      .eq("establishment_id", estId)
      .order("period_start", { ascending: false });

    if (error) throw error;
    setCostAnalysis(data || []);
  };

  const loadProducts = async (estId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .eq("establishment_id", estId)
      .eq("active", true)
      .order("name");

    if (error) throw error;
    setProducts(data || []);
  };

  const handleFixedCostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      setSaving(false);
      return;
    }
    const costData = {
      name: (formData.get("name") as string)?.trim(),
      description: ((formData.get("description") as string) || null) as string | null,
      amount: parseNumber(formData.get("amount")),
      start_date: formData.get("start_date") as string,
      recurrence: formData.get("recurrence") as 'monthly' | 'annual' | 'one_time',
      establishment_id: establishmentId!,
    } as const;

    try {
      if (editingFixedCost) {
        const { error } = await supabase
          .from("fixed_costs")
          .update(costData)
          .eq("id", editingFixedCost.id);

        if (error) throw error;
        toast.success("Custo fixo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("fixed_costs")
          .insert(costData);

        if (error) throw error;
        toast.success("Custo fixo cadastrado com sucesso!");
      }

      setEditingFixedCost(null);
      e.currentTarget.reset();
      await loadFixedCosts(establishmentId!);
    } catch (error: any) {
      console.error("Error saving fixed cost:", error);
      const message = error?.message || (typeof error === 'string' ? error : 'Erro ao salvar custo fixo');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleVariableCostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      setSaving(false);
      return;
    }
    const quantity = parseNumber(formData.get("quantity"));
    const total_cost = parseNumber(formData.get("total_cost"));
    const costData = {
      name: (formData.get("name") as string)?.trim(),
      description: ((formData.get("description") as string) || null) as string | null,
      quantity,
      total_cost,
      unit_measure: formData.get("unit_measure") as string,
      supplier: formData.get("supplier") as string,
      purchase_date: formData.get("purchase_date") as string,
      expiry_date: formData.get("expiry_date") as string || null,
      establishment_id: establishmentId!,
    };

    try {
      if (editingVariableCost) {
        const { error } = await supabase
          .from("variable_costs")
          .update(costData)
          .eq("id", editingVariableCost.id);

        if (error) throw error;
        toast.success("Custo variável atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("variable_costs")
          .insert(costData);

        if (error) throw error;
        toast.success("Custo variável cadastrado com sucesso!");
      }

      setEditingVariableCost(null);
      e.currentTarget.reset();
      await loadVariableCosts(establishmentId!);
    } catch (error: any) {
      console.error("Error saving variable cost:", error);
      const message = error?.message || (typeof error === 'string' ? error : 'Erro ao salvar custo variável');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleProductIngredientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const quantity_used = parseNumber(formData.get("quantity_used"));
    const unit_cost_at_time = parseNumber(formData.get("unit_cost_at_time"));
    const ingredientData = {
      product_id: (formData.get("product_id") as string) || '',
      variable_cost_id: (formData.get("variable_cost_id") as string) || '',
      quantity_used,
      unit_cost_at_time,
    };

    try {
      if (editingProductIngredient) {
        const { error } = await supabase
          .from("product_ingredients")
          .update(ingredientData)
          .eq("id", editingProductIngredient.id);

        if (error) throw error;
        toast.success("Ingrediente do produto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("product_ingredients")
          .insert(ingredientData);

        if (error) throw error;
        toast.success("Ingrediente do produto cadastrado com sucesso!");
      }

      setEditingProductIngredient(null);
      e.currentTarget.reset();
      await loadProductIngredients(establishmentId!);
    } catch (error: any) {
      console.error("Error saving product ingredient:", error);
      const message = error?.message || (typeof error === 'string' ? error : 'Erro ao salvar ingrediente do produto');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteFixedCost = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este custo fixo?")) return;

    try {
      const { error } = await supabase
        .from("fixed_costs")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Custo fixo excluído com sucesso!");
      await loadFixedCosts(establishmentId!);
    } catch (error) {
      console.error("Error deleting fixed cost:", error);
      toast.error("Erro ao excluir custo fixo");
    }
  };

  const deleteVariableCost = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este custo variável?")) return;

    try {
      const { error } = await supabase
        .from("variable_costs")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Custo variável excluído com sucesso!");
      await loadVariableCosts(establishmentId!);
    } catch (error) {
      console.error("Error deleting variable cost:", error);
      toast.error("Erro ao excluir custo variável");
    }
  };

  const deleteProductIngredient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;

    try {
      const { error } = await supabase
        .from("product_ingredients")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Ingrediente excluído com sucesso!");
      await loadProductIngredients(establishmentId!);
    } catch (error) {
      console.error("Error deleting product ingredient:", error);
      toast.error("Erro ao excluir ingrediente");
    }
  };

  const calculateMonthlyFixedCosts = () => {
    return fixedCosts.reduce((total, cost) => {
      if (cost.recurrence === 'monthly') {
        return total + cost.amount;
      } else if (cost.recurrence === 'annual') {
        return total + (cost.amount / 12);
      } else {
        // one_time costs are not included in monthly calculation
        return total;
      }
    }, 0);
  };

  const calculateTotalVariableCosts = () => {
    return variableCosts.reduce((total, cost) => total + cost.total_cost, 0);
  };

  const calculateAverageUnitCost = () => {
    if (variableCosts.length === 0) return 0;
    return variableCosts.reduce((total, cost) => total + cost.unit_cost, 0) / variableCosts.length;
  };

  const calculateSuggestedPrice = (unitCost: number) => {
    return unitCost * (1 + profitMargin / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados de custos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calculator className="mr-3 h-8 w-8" />
              <h1 className="text-3xl font-bold text-foreground">Dados Técnicos</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="profit_margin">Margem de Lucro (%):</Label>
                <Input
                  id="profit_margin"
                  type="number"
                  min="0"
                  max="100"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mês Atual</SelectItem>
                  <SelectItem value="last_month">Mês Passado</SelectItem>
                  <SelectItem value="current_year">Ano Atual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custos Fixos Mensais</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {calculateMonthlyFixedCosts().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Total de {fixedCosts.length} custos fixos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custos Variáveis</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {calculateTotalVariableCosts().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {variableCosts.length} ingredientes cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Unitário Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {calculateAverageUnitCost().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Média por ingrediente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profitMargin}%</div>
                <p className="text-xs text-muted-foreground">
                  Multiplicador: {(1 + profitMargin / 100).toFixed(2)}x
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="fixed_costs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fixed_costs">Custos Fixos</TabsTrigger>
              <TabsTrigger value="variable_costs">Custos Variáveis</TabsTrigger>
              <TabsTrigger value="product_ingredients">Ingredientes dos Produtos</TabsTrigger>
              <TabsTrigger value="analysis">Análise</TabsTrigger>
            </TabsList>

            {/* Custos Fixos */}
            <TabsContent value="fixed_costs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cadastro de Custos Fixos</span>
                    <Button
                      onClick={() => { setEditingFixedCost(null); setFixedCostRecurrence('monthly'); }}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Custo
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFixedCostSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Custo *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingFixedCost?.name || ""}
                          required
                          placeholder="Ex: Aluguel"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Valor (R$) *</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={editingFixedCost?.amount || ""}
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Data de Início *</Label>
                        <Input
                          id="start_date"
                          name="start_date"
                          type="date"
                          defaultValue={editingFixedCost?.start_date || ""}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="recurrence">Recorrência *</Label>
                        <Select value={fixedCostRecurrence} onValueChange={(v) => setFixedCostRecurrence(v as 'monthly' | 'annual' | 'one_time')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="annual">Anual</SelectItem>
                            <SelectItem value="one_time">Único</SelectItem>
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="recurrence" value={fixedCostRecurrence} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingFixedCost?.description || ""}
                        rows={3}
                        placeholder="Descrição detalhada do custo..."
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Salvando..." : editingFixedCost ? "Atualizar" : "Cadastrar"}
                      </Button>
                      {editingFixedCost && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingFixedCost(null)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Custos Fixos */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Custos Fixos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fixedCosts.map((cost) => (
                      <div key={cost.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{cost.name}</h4>
                            <Badge variant={cost.recurrence === 'monthly' ? 'default' : cost.recurrence === 'annual' ? 'secondary' : 'outline'}>
                              {cost.recurrence === 'monthly' ? 'Mensal' : cost.recurrence === 'annual' ? 'Anual' : 'Único'}
                            </Badge>
                          </div>
                          {cost.description && (
                            <p className="text-sm text-muted-foreground mt-1">{cost.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            R$ {cost.amount.toFixed(2)} • Início: {new Date(cost.start_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFixedCost(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFixedCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {fixedCosts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum custo fixo cadastrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custos Variáveis */}
            <TabsContent value="variable_costs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cadastro de Custos Variáveis (Ingredientes)</span>
                    <Button
                      onClick={() => { setEditingVariableCost(null); setVariableUnitMeasure('unidade'); }}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Ingrediente
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVariableCostSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Ingrediente *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingVariableCost?.name || ""}
                          required
                          placeholder="Ex: Pão de Hambúrguer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="unit_measure">Unidade de Medida *</Label>
                        <Select value={variableUnitMeasure} onValueChange={(v) => setVariableUnitMeasure(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unidade">Unidade</SelectItem>
                            <SelectItem value="kg">Quilograma (kg)</SelectItem>
                            <SelectItem value="g">Grama (g)</SelectItem>
                            <SelectItem value="l">Litro (L)</SelectItem>
                            <SelectItem value="ml">Mililitro (ml)</SelectItem>
                            <SelectItem value="pacote">Pacote</SelectItem>
                            <SelectItem value="caixa">Caixa</SelectItem>
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="unit_measure" value={variableUnitMeasure} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade Adquirida *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          step="0.001"
                          min="0"
                          defaultValue={editingVariableCost?.quantity || ""}
                          required
                          placeholder="0.000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="total_cost">Valor Total Pago (R$) *</Label>
                        <Input
                          id="total_cost"
                          name="total_cost"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={editingVariableCost?.total_cost || ""}
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchase_date">Data da Compra *</Label>
                        <Input
                          id="purchase_date"
                          name="purchase_date"
                          type="date"
                          defaultValue={editingVariableCost?.purchase_date || ""}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expiry_date">Data de Validade</Label>
                        <Input
                          id="expiry_date"
                          name="expiry_date"
                          type="date"
                          defaultValue={editingVariableCost?.expiry_date || ""}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Fornecedor</Label>
                      <Input
                        id="supplier"
                        name="supplier"
                        defaultValue={editingVariableCost?.supplier || ""}
                        placeholder="Nome do fornecedor"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingVariableCost?.description || ""}
                        rows={3}
                        placeholder="Descrição detalhada do ingrediente..."
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Salvando..." : editingVariableCost ? "Atualizar" : "Cadastrar"}
                      </Button>
                      {editingVariableCost && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingVariableCost(null)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Custos Variáveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Ingredientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variableCosts.map((cost) => (
                      <div key={cost.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{cost.name}</h4>
                            <Badge variant="outline">{cost.unit_measure}</Badge>
                          </div>
                          {cost.description && (
                            <p className="text-sm text-muted-foreground mt-1">{cost.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {cost.quantity} {cost.unit_measure} • R$ {cost.total_cost.toFixed(2)} • 
                            Custo unitário: R$ {cost.unit_cost.toFixed(4)}
                          </p>
                          {cost.supplier && (
                            <p className="text-sm text-muted-foreground">
                              Fornecedor: {cost.supplier}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVariableCost(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteVariableCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {variableCosts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum ingrediente cadastrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ingredientes dos Produtos */}
            <TabsContent value="product_ingredients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Configuração de Ingredientes dos Produtos</span>
                    <Button
                      onClick={() => { setEditingProductIngredient(null); setSelectedProductId(''); setSelectedIngredientId(''); }}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Ingrediente
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProductIngredientSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_id">Produto *</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="product_id" value={selectedProductId} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="variable_cost_id">Ingrediente *</Label>
                        <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um ingrediente" />
                          </SelectTrigger>
                          <SelectContent>
                            {variableCosts.map((cost) => (
                              <SelectItem key={cost.id} value={cost.id}>
                                {cost.name} - R$ {cost.unit_cost.toFixed(4)}/{cost.unit_measure}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="variable_cost_id" value={selectedIngredientId} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity_used">Quantidade Utilizada *</Label>
                        <Input
                          id="quantity_used"
                          name="quantity_used"
                          type="number"
                          step="0.001"
                          min="0"
                          defaultValue={editingProductIngredient?.quantity_used || ""}
                          required
                          placeholder="0.000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="unit_cost_at_time">Custo Unitário no Momento (R$) *</Label>
                        <Input
                          id="unit_cost_at_time"
                          name="unit_cost_at_time"
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={editingProductIngredient?.unit_cost_at_time || ""}
                          required
                          placeholder="0.0000"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Salvando..." : editingProductIngredient ? "Atualizar" : "Cadastrar"}
                      </Button>
                      {editingProductIngredient && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingProductIngredient(null)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

                             {/* Lista de Ingredientes dos Produtos */}
               <Card>
                 <CardHeader>
                   <CardTitle>Ingredientes Configurados</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                    {productIngredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{ingredient.product_name}</h4>
                            <Badge variant="outline">→</Badge>
                            <span className="font-medium">{ingredient.ingredient_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {ingredient.quantity_used} unidades • R$ {ingredient.unit_cost_at_time.toFixed(4)} cada • 
                            Total: R$ {ingredient.total_cost.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProductIngredient(ingredient)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProductIngredient(ingredient.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {productIngredients.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum ingrediente configurado para produtos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Análise de Custos */}
            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pizza - Distribuição de Custos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="mr-2 h-5 w-5" />
                      Distribuição de Custos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custos Fixos</span>
                        <span className="font-medium">R$ {calculateMonthlyFixedCosts().toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custos Variáveis</span>
                        <span className="font-medium">R$ {calculateTotalVariableCosts().toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span>R$ {(calculateMonthlyFixedCosts() + calculateTotalVariableCosts()).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Barras - Análise de Produtos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Análise de Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custo Unitário Médio</span>
                        <span className="font-medium">R$ {calculateAverageUnitCost().toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Preço Sugerido (30% margem)</span>
                        <span className="font-medium">R$ {calculateSuggestedPrice(calculateAverageUnitCost()).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Margem de Lucro Configurada</span>
                        <span className="font-medium">{profitMargin}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Relatórios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Relatórios de Custos</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const win = window.open('', '_blank');
                        if (!win) return;
                        const rows = costAnalysis.map((a) => `
                          <tr>
                            <td>${new Date(a.period_start).toLocaleDateString('pt-BR')}</td>
                            <td>${new Date(a.period_end).toLocaleDateString('pt-BR')}</td>
                            <td>R$ ${a.total_fixed_costs.toFixed(2)}</td>
                            <td>R$ ${a.total_variable_costs.toFixed(2)}</td>
                            <td>R$ ${a.average_cost_per_product.toFixed(2)}</td>
                            <td>${a.profit_margin_percentage}%</td>
                            <td>${a.suggested_price_multiplier.toFixed(2)}x</td>
                          </tr>
                        `).join('');
                        win.document.write(`
                          <html>
                            <head>
                              <title>Relatório de Custos</title>
                              <style>
                                table { width: 100%; border-collapse: collapse; }
                                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                                th { background: #f5f5f5; }
                              </style>
                            </head>
                            <body>
                              <h2>Relatório de Custos</h2>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Início</th>
                                    <th>Fim</th>
                                    <th>Fixos</th>
                                    <th>Variáveis</th>
                                    <th>Custo Unitário</th>
                                    <th>Margem</th>
                                    <th>Multiplicador</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${rows}
                                </tbody>
                              </table>
                            </body>
                          </html>
                        `);
                        win.document.close();
                        win.focus();
                        win.print();
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const header = [
                          'periodo_inicio',
                          'periodo_fim',
                          'custos_fixos',
                          'custos_variaveis',
                          'custo_unitario',
                          'margem',
                          'multiplicador'
                        ];
                        const rows = costAnalysis.map((a) => [
                          new Date(a.period_start).toLocaleDateString('pt-BR'),
                          new Date(a.period_end).toLocaleDateString('pt-BR'),
                          a.total_fixed_costs.toFixed(2),
                          a.total_variable_costs.toFixed(2),
                          a.average_cost_per_product.toFixed(2),
                          `${a.profit_margin_percentage}%`,
                          a.suggested_price_multiplier.toFixed(2)
                        ]);
                        const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'relatorio_custos.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {costAnalysis.map((analysis) => (
                      <div key={analysis.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            Período: {new Date(analysis.period_start).toLocaleDateString('pt-BR')} - {new Date(analysis.period_end).toLocaleDateString('pt-BR')}
                          </h4>
                          <Badge variant="outline">
                            Margem: {analysis.profit_margin_percentage}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Custos Fixos:</span>
                            <p className="font-medium">R$ {analysis.total_fixed_costs.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Custos Variáveis:</span>
                            <p className="font-medium">R$ {analysis.total_variable_costs.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Custo Unitário:</span>
                            <p className="font-medium">R$ {analysis.average_cost_per_product.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Multiplicador:</span>
                            <p className="font-medium">{analysis.suggested_price_multiplier.toFixed(2)}x</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {costAnalysis.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum relatório de análise disponível
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Costs;
