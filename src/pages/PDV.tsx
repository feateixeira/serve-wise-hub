import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Receipt,
  Search,
  X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category_id?: string;
}

interface Sauce {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
  selectedSauces: string[];
  saucePrice: number;
}

const PDV = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFreeThreshold, setDeliveryFreeThreshold] = useState(0);

  // Molhos disponíveis
  const availableSauces: Sauce[] = [
    { id: "bacon", name: "Bacon", price: 0 },
    { id: "ervas", name: "Ervas", price: 0 },
    { id: "alho", name: "Alho", price: 0 },
    { id: "mostarda-mel", name: "Mostarda e Mel", price: 0 }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("establishment_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.establishment_id) return;

      const [productsResult, categoriesResult, establishmentResult] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("establishment_id", profile.establishment_id)
          .eq("active", true)
          .order("name"),
        supabase
          .from("categories")
          .select("*")
          .eq("establishment_id", profile.establishment_id)
          .eq("active", true)
          .order("sort_order"),
        supabase
          .from("establishments")
          .select("settings")
          .eq("id", profile.establishment_id)
          .single()
      ]);

      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (establishmentResult.error) throw establishmentResult.error;

      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
      
      // Carrega configurações de entrega
      if (establishmentResult.data?.settings) {
        const settings = establishmentResult.data.settings;
        setDeliveryFee(settings.delivery_fee || 0);
        setDeliveryFreeThreshold(settings.delivery_free_threshold || 0);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { 
        ...product, 
        quantity: 1, 
        selectedSauces: [],
        saucePrice: 0
      }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleSauceSelection = (productId: string, sauceId: string, checked: boolean) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          let newSelectedSauces = [...item.selectedSauces];
          
          if (checked) {
            newSelectedSauces.push(sauceId);
          } else {
            newSelectedSauces = newSelectedSauces.filter(id => id !== sauceId);
          }

          // Calcular preço dos molhos
          const isTriple = item.name.toLowerCase().includes('triplo') || item.name.toLowerCase().includes('triple');
          const freeSauces = isTriple ? 2 : 1;
          const paidSauces = Math.max(0, newSelectedSauces.length - freeSauces);
          const saucePrice = paidSauces * 2; // R$ 2,00 por molho adicional

          return {
            ...item,
            selectedSauces: newSelectedSauces,
            saucePrice
          };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      const itemTotal = (item.price * item.quantity) + item.saucePrice;
      return total + itemTotal;
    }, 0);
    
    // Adiciona taxa de entrega se habilitada
    if (deliveryEnabled && deliveryFee > 0) {
      // Verifica se o pedido atinge o valor mínimo para entrega grátis
      if (deliveryFreeThreshold > 0 && subtotal >= deliveryFreeThreshold) {
        return subtotal; // Entrega grátis
      }
      return subtotal + deliveryFee;
    }
    
    return subtotal;
  };

  const getSauceName = (sauceId: string) => {
    const sauce = availableSauces.find(s => s.id === sauceId);
    return sauce?.name || sauceId;
  };

  const isSauceFree = (item: CartItem, sauceId: string) => {
    const isTriple = item.name.toLowerCase().includes('triplo') || item.name.toLowerCase().includes('triple');
    const freeSauces = isTriple ? 2 : 1;
    const sauceIndex = item.selectedSauces.indexOf(sauceId);
    return sauceIndex < freeSauces;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Get user profile to get establishment_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("establishment_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.establishment_id) {
        toast.error("Estabelecimento não encontrado");
        return;
      }

      const orderNumber = `PDV-${Date.now()}`;
      const total = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          establishment_id: profile.establishment_id,
          order_number: orderNumber,
          customer_name: customerName || "Cliente Balcão",
          customer_phone: customerPhone,
          order_type: deliveryEnabled ? "delivery" : "balcao",
          status: "completed",
          payment_status: "paid",
          subtotal: total,
          total_amount: total,
          notes: deliveryEnabled ? "Entrega solicitada" : undefined
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: (item.price * item.quantity) + item.saucePrice,
        selected_sauces: item.selectedSauces,
        sauce_price: item.saucePrice
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and customer info
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");

      toast.success(`Venda finalizada! Pedido: ${orderNumber}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro ao finalizar venda");
    }
  };

  const getProductsByCategory = () => {
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Organize products by category with specific order
    const categoryOrder = ['HAMBÚRGUERES', 'ACOMPANHAMENTOS', 'BEBIDAS'];
    const organizedProducts: { [key: string]: Product[] } = {};

    // Initialize categories in order
    categoryOrder.forEach(catName => {
      organizedProducts[catName] = [];
    });

    // Group products by category
    filteredProducts.forEach(product => {
      const category = categories.find(cat => cat.id === product.category_id);
      const categoryName = category?.name || 'OUTROS';
      
      if (!organizedProducts[categoryName]) {
        organizedProducts[categoryName] = [];
      }
      organizedProducts[categoryName].push(product);
    });

    // Return categories in the correct order, only if they have products
    const finalOrganized: { [key: string]: Product[] } = {};
    
    categoryOrder.forEach(categoryName => {
      if (organizedProducts[categoryName] && organizedProducts[categoryName].length > 0) {
        finalOrganized[categoryName] = organizedProducts[categoryName];
      }
    });

    // Add any other categories that might exist
    Object.keys(organizedProducts).forEach(categoryName => {
      if (!categoryOrder.includes(categoryName) && organizedProducts[categoryName].length > 0) {
        finalOrganized[categoryName] = organizedProducts[categoryName];
      }
    });

    return finalOrganized;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
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
            <h1 className="text-3xl font-bold text-foreground">PDV - Ponto de Venda</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2">
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Produtos</CardTitle>
                    <div className="relative w-48">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-7 h-8 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {(() => {
                    const productsByCategory = getProductsByCategory();
                    const hasProducts = Object.values(productsByCategory).some(products => products.length > 0);

                    if (!hasProducts) {
                      return (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => {
                          if (categoryProducts.length === 0) return null;

                          return (
                            <div key={categoryName}>
                              <h3 className="text-sm font-semibold mb-2 text-primary border-b border-border pb-1">
                                {categoryName}
                              </h3>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                {categoryProducts.map((product) => (
                                  <Card key={product.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                                    <CardContent className="p-2">
                                      <div className="space-y-1">
                                        <h4 className="font-medium text-xs leading-tight line-clamp-2 h-8">{product.name}</h4>
                                        <div className="flex flex-col items-center space-y-1">
                                          <span className="font-bold text-primary text-xs">
                                            R$ {product.price.toFixed(2)}
                                          </span>
                                          <Button 
                                            size="sm" 
                                            onClick={() => addToCart(product)}
                                            className="h-6 w-full text-xs"
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Cart Section */}
            <div>
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Nome do cliente"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Telefone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Delivery Options */}
                  {deliveryFee > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Entrega</span>
                        <Button
                          type="button"
                          variant={deliveryEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDeliveryEnabled(!deliveryEnabled)}
                          className="h-8"
                        >
                          {deliveryEnabled ? "Ativada" : "Ativar"}
                        </Button>
                      </div>
                      
                      {deliveryEnabled && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Taxa de entrega: R$ {deliveryFee.toFixed(2)}</p>
                          {deliveryFreeThreshold > 0 && (
                            <p>Pedido mínimo para entrega grátis: R$ {deliveryFreeThreshold.toFixed(2)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart Items */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="p-2 border rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.price.toFixed(2)} cada
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-2 w-2" />
                            </Button>
                            
                            <span className="text-xs w-6 text-center">{item.quantity}</span>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-2 w-2" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>

                        {/* Seleção de Molhos - Apenas para hambúrgueres por categoria */}
                        {(() => {
                          // Busca a categoria do produto
                          const category = categories.find(cat => cat.id === item.category_id);
                          const categoryName = category?.name?.toLowerCase() || '';
                          
                          // Detecta se é um hambúrguer por categoria
                          const isHamburger = 
                            categoryName.includes('hamburguers') ||
                            categoryName.includes('hambúrguer') ||
                            categoryName.includes('hamburger') ||
                            categoryName.includes('burger') ||
                            categoryName.includes('lanche') ||
                            categoryName.includes('sanduíche') ||
                            categoryName.includes('sanduiche');
                          
                          return isHamburger;
                        })() && (
                        <div className="border-t pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Molhos: {item.name.toLowerCase().includes('triplo') || item.name.toLowerCase().includes('triple') ? '2 grátis' : '1 grátis'}
                            </p>
                            {item.saucePrice > 0 && (
                              <span className="text-xs text-orange-600 font-medium">
                                +R$ {item.saucePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          {/* Molhos em linha horizontal */}
                          <div className="grid grid-cols-2 gap-1">
                            {availableSauces.map((sauce) => (
                              <div key={sauce.id} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`${item.id}-${sauce.id}`}
                                  checked={item.selectedSauces.includes(sauce.id)}
                                  onCheckedChange={(checked) => 
                                    handleSauceSelection(item.id, sauce.id, checked as boolean)
                                  }
                                  className="h-3 w-3"
                                />
                                <label 
                                  htmlFor={`${item.id}-${sauce.id}`}
                                  className="text-xs flex items-center space-x-1 cursor-pointer"
                                >
                                  <span>{sauce.name}</span>
                                  {!isSauceFree(item, sauce.id) && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                                      +R$ 2,00
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          
                          {/* Molhos selecionados */}
                          {item.selectedSauces.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-dashed">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Selecionados:</span> {item.selectedSauces.map(sauceId => getSauceName(sauceId)).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {cart.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Carrinho vazio</p>
                    </div>
                  )}

                  {/* Total */}
                  {cart.length > 0 && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Subtotal dos produtos */}
                      <div className="flex justify-between text-sm">
                        <span>Subtotal produtos:</span>
                        <span>R$ {cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
                      </div>
                      
                      {/* Total dos molhos */}
                      {cart.some(item => item.saucePrice > 0) && (
                        <div className="flex justify-between text-sm">
                          <span>Molhos adicionais:</span>
                          <span>R$ {cart.reduce((total, item) => total + item.saucePrice, 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Taxa de entrega */}
                      {deliveryEnabled && deliveryFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Taxa de entrega:</span>
                          <span>
                            {(() => {
                              const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity) + item.saucePrice, 0);
                              if (deliveryFreeThreshold > 0 && subtotal >= deliveryFreeThreshold) {
                                return "Grátis";
                              }
                              return `R$ ${deliveryFee.toFixed(2)}`;
                            })()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleCheckout}
                      >
                        <Receipt className="mr-2 h-4 w-4" />
                        {deliveryEnabled ? "Finalizar Entrega" : "Finalizar Venda"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PDV;