import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock,
  Package,
  Target,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CreditCard,
  Eye,
  MoreHorizontal,
  LogOut,
  Settings,
  Receipt,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Percent,
  Gift,
  Truck
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

// Dados mock zerados inicialmente - serão atualizados com metas reais
let salesData = [
  { name: 'Jan', vendas: 0, pedidos: 0, meta: 15000 },
  { name: 'Fev', vendas: 0, pedidos: 0, meta: 15000 },
  { name: 'Mar', vendas: 0, pedidos: 0, meta: 15000 },
  { name: 'Abr', vendas: 0, pedidos: 0, meta: 15000 },
  { name: 'Mai', vendas: 0, pedidos: 0, meta: 15000 },
  { name: 'Jun', vendas: 0, pedidos: 0, meta: 15000 },
];

const dailyData = [
  { hora: '08:00', valor: 0, pedidos: 0 },
  { hora: '10:00', valor: 0, pedidos: 0 },
  { hora: '12:00', valor: 0, pedidos: 0 },
  { hora: '14:00', valor: 0, pedidos: 0 },
  { hora: '16:00', valor: 0, pedidos: 0 },
  { hora: '18:00', valor: 0, pedidos: 0 },
  { hora: '20:00', valor: 0, pedidos: 0 },
  { hora: '22:00', valor: 0, pedidos: 0 },
];

const categoryData = [
  { name: 'Lanches', value: 0, color: '#8884d8' },
  { name: 'Bebidas', value: 0, color: '#82ca9d' },
  { name: 'Sobremesas', value: 0, color: '#ffc658' },
  { name: 'Acompanhamentos', value: 0, color: '#ff7300' },
];

const recentOrders = [
  // Inicialmente vazio
];

const topProducts = [
  // Inicialmente vazio
];

const weeklyComparison = [
  { day: 'Seg', atual: 0, anterior: 0 },
  { day: 'Ter', atual: 0, anterior: 0 },
  { day: 'Qua', atual: 0, anterior: 0 },
  { day: 'Qui', atual: 0, anterior: 0 },
  { day: 'Sex', atual: 0, anterior: 0 },
  { day: 'Sáb', atual: 0, anterior: 0 },
  { day: 'Dom', atual: 0, anterior: 0 },
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('hoje');
  const [goals, setGoals] = useState({
    daily_revenue_goal: 10000,
    monthly_revenue_goal: 30000,
    monthly_orders_goal: 300,
    monthly_customers_goal: 50,
    monthly_sales_goal: 15000,
    daily_orders_goal: 10,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  // Atualiza os dados de vendas quando as metas mudam
  useEffect(() => {
    salesData = salesData.map(item => ({
      ...item,
      meta: goals.monthly_sales_goal
    }));
  }, [goals.monthly_sales_goal]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Get user profile and establishment
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          *,
          establishments (*)
        `)
        .eq("user_id", session.user.id)
        .single();

      if (profile?.establishments) {
        setEstablishment(profile.establishments);
        
        // Carrega as metas das configurações
        if (profile.establishments.settings) {
          const settings = profile.establishments.settings;
          setGoals({
            daily_revenue_goal: settings.daily_revenue_goal || 10000,
            monthly_revenue_goal: settings.monthly_revenue_goal || 30000,
            monthly_orders_goal: settings.monthly_orders_goal || 300,
            monthly_customers_goal: settings.monthly_customers_goal || 50,
            monthly_sales_goal: settings.monthly_sales_goal || 15000,
            daily_orders_goal: settings.daily_orders_goal || 10,
          });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              {establishment?.name || "Bem-vindo ao PedeServe"} - Visão completa do negócio
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hoje">Hoje</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faturamento {timeRange === 'hoje' ? 'Hoje' : timeRange === 'semana' ? 'na Semana' : 'no Mês'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +0% em relação ao período anterior
              </div>
              <Progress value={0} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Meta: R$ {timeRange === 'hoje' ? goals.daily_revenue_goal.toLocaleString('pt-BR') : goals.monthly_revenue_goal.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos {timeRange === 'hoje' ? 'Hoje' : timeRange === 'semana' ? 'na Semana' : 'no Mês'}
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +0% em relação ao período anterior
              </div>
              <div className="flex space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  0 Concluídos
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  0 Pendentes
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                +0% em relação ao período anterior
              </div>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  Maior: R$ 0,00 | Menor: R$ 0,00
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 text-blue-500 mr-1" />
                0 novos este mês
              </div>
              <div className="flex space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  0 VIPs
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Gift className="h-3 w-3 mr-1" />
                  0 Ativos
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Main Sales Chart */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Análise de Vendas
                <div className="flex space-x-2">
                  <Badge variant="outline">Últimos 6 meses</Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="vendas"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <YAxis
                    yAxisId="pedidos"
                    orientation="right"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'vendas' ? `R$ ${value}` : value,
                      name === 'vendas' ? 'Vendas' : name === 'pedidos' ? 'Pedidos' : 'Meta'
                    ]}
                  />
                  <Area 
                    yAxisId="vendas"
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                  />
                  <Line 
                    yAxisId="vendas"
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#ff7300" 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Bar 
                    yAxisId="pedidos"
                    dataKey="pedidos" 
                    fill="#82ca9d"
                    opacity={0.7}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Vendas por Categoria</CardTitle>
              <CardDescription>
                Distribuição do faturamento por tipo de produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      categoryData.some(item => item.value > 0) 
                        ? `${name} ${(percent * 100).toFixed(0)}%` 
                        : ''
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
                </PieChart>
              </ResponsiveContainer>
              {categoryData.every(item => item.value === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma venda por categoria</p>
                </div>
              )}
              <div className="mt-4 space-y-2">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                    <span className="font-medium">R$ {category.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Metas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Faturamento</span>
                  <span>R$ 0 / R$ {goals.monthly_revenue_goal.toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">0% da meta</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Pedidos</span>
                  <span>0 / {goals.monthly_orders_goal}</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">0% da meta</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Novos Clientes</span>
                  <span>0 / {goals.monthly_customers_goal}</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">0% da meta</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Horários de Pico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hora" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'valor' ? `R$ ${value}` : value,
                      name === 'valor' ? 'Vendas' : 'Pedidos'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pedidos" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={{ fill: '#82ca9d', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {dailyData.every(item => item.valor === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhuma atividade registrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Status Operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Sistema Online</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Produtos Ativos</span>
                </div>
                <Badge variant="secondary">
                  0
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Último Backup</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Agora
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Performance</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Excelente
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Comparativo Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={weeklyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value, name) => [
                      `R$ ${value}`,
                      name === 'atual' ? 'Semana Atual' : 'Semana Anterior'
                    ]}
                  />
                  <Bar dataKey="anterior" fill="#e2e8f0" />
                  <Bar dataKey="atual" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              {weeklyComparison.every(item => item.atual === 0 && item.anterior === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <BarChart className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Dados insuficientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  Pedidos Recentes
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigate("/pdv")}>
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum pedido encontrado</p>
                  <p className="text-sm">Os pedidos aparecerão aqui quando criados</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate("/pdv")}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Criar Primeiro Pedido
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de pedidos será populada quando houver dados */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Produtos Mais Vendidos
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum produto vendido</p>
                  <p className="text-sm">Os produtos mais vendidos aparecerão aqui</p>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => navigate("/products")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Gerenciar Produtos
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de produtos será populada quando houver dados */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Central de Ações
            </CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                className="h-20 flex-col space-y-2" 
                onClick={() => navigate("/pdv")}
              >
                <Receipt className="h-6 w-6" />
                <span>Abrir PDV</span>
              </Button>
              <Button 
                className="h-20 flex-col space-y-2" 
                variant="outline"
                onClick={() => navigate("/products")}
              >
                <Package className="h-6 w-6" />
                <span>Produtos</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Users className="h-6 w-6" />
                <span>Clientes</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <CreditCard className="h-6 w-6" />
                <span>Relatórios</span>
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-4 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Configurações Rápidas
              </h4>
              <div className="grid gap-3 md:grid-cols-3">
                <Button size="sm" variant="ghost" className="justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Dados do Estabelecimento
                </Button>
                <Button size="sm" variant="ghost" className="justify-start">
                  <Percent className="h-4 w-4 mr-2" />
                  Impostos e Taxas
                </Button>
                <Button size="sm" variant="ghost" className="justify-start">
                  <Truck className="h-4 w-4 mr-2" />
                  Delivery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;