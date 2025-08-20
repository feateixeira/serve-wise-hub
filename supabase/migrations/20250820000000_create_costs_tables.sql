-- Create fixed_costs table
CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('monthly', 'annual', 'one_time')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create variable_costs table (ingredients/matéria-prima)
CREATE TABLE public.variable_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,4) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,4) GENERATED ALWAYS AS (total_cost / quantity) STORED,
  unit_measure TEXT NOT NULL, -- kg, unidade, pacote, litro, etc.
  supplier TEXT,
  purchase_date DATE NOT NULL,
  expiry_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_ingredients table to link products with ingredients
CREATE TABLE public.product_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variable_cost_id UUID NOT NULL REFERENCES public.variable_costs(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,4) NOT NULL,
  unit_cost_at_time DECIMAL(10,4) NOT NULL,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_used * unit_cost_at_time) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost_analysis table for storing calculated costs
CREATE TABLE public.cost_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_fixed_costs DECIMAL(10,2) NOT NULL,
  total_variable_costs DECIMAL(10,2) NOT NULL,
  total_products_sold INTEGER NOT NULL DEFAULT 0,
  average_cost_per_product DECIMAL(10,4) NOT NULL,
  profit_margin_percentage DECIMAL(5,2) NOT NULL,
  suggested_price_multiplier DECIMAL(5,2) GENERATED ALWAYS AS (1 + (profit_margin_percentage / 100)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fixed_costs
CREATE POLICY "Users can manage fixed costs in their establishment" 
  ON public.fixed_costs FOR ALL 
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for variable_costs
CREATE POLICY "Users can manage variable costs in their establishment" 
  ON public.variable_costs FOR ALL 
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for product_ingredients
CREATE POLICY "Users can manage product ingredients through products" 
  ON public.product_ingredients FOR ALL 
  USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE establishment_id IN (
        SELECT establishment_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create RLS policies for cost_analysis
CREATE POLICY "Users can manage cost analysis in their establishment" 
  ON public.cost_analysis FOR ALL 
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_fixed_costs_updated_at
  BEFORE UPDATE ON public.fixed_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_variable_costs_updated_at
  BEFORE UPDATE ON public.variable_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_fixed_costs_establishment_id ON public.fixed_costs(establishment_id);
CREATE INDEX idx_variable_costs_establishment_id ON public.variable_costs(establishment_id);
CREATE INDEX idx_product_ingredients_product_id ON public.product_ingredients(product_id);
CREATE INDEX idx_cost_analysis_establishment_id ON public.cost_analysis(establishment_id);
CREATE INDEX idx_cost_analysis_period ON public.cost_analysis(period_start, period_end);

