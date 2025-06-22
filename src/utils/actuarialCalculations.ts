interface CalculationParams {
  annuityType: string;
  age: number;
  gender: string;
  interestRate: number;
  annualAmount: number;
  mortalityTable: string;
  duration?: number;
  deferralPeriod?: number;
  growthRate?: number;
  reversalRate?: number;
  spouseAge?: number;
}

interface CalculationResult {
  presentValue: number;
  monthlyPayment: number;
  totalPayments: number;
  lifeExpectancy: number;
  projections: Array<{
    year: number;
    payment: number;
    cumulativePayment: number;
    probability: number;
  }>;
}

// Simplified mortality tables (in real application, these would be comprehensive actuarial tables)
const mortalityRates: Record<string, Record<string, number[]>> = {
  TGH05: {
    male: Array.from({ length: 100 }, (_, i) => Math.min(0.001 + (i * 0.002), 0.3)),
    female: Array.from({ length: 100 }, (_, i) => Math.min(0.0008 + (i * 0.0018), 0.25)),
  },
  TGF05: {
    male: Array.from({ length: 100 }, (_, i) => Math.min(0.001 + (i * 0.002), 0.3)),
    female: Array.from({ length: 100 }, (_, i) => Math.min(0.0008 + (i * 0.0018), 0.25)),
  },
  'TV88-90': {
    male: Array.from({ length: 100 }, (_, i) => Math.min(0.0009 + (i * 0.0019), 0.28)),
    female: Array.from({ length: 100 }, (_, i) => Math.min(0.0009 + (i * 0.0019), 0.28)),
  },
  'TH00-02': {
    male: Array.from({ length: 100 }, (_, i) => Math.min(0.0012 + (i * 0.0022), 0.32)),
    female: Array.from({ length: 100 }, (_, i) => Math.min(0.001 + (i * 0.002), 0.27)),
  },
  'TF00-02': {
    male: Array.from({ length: 100 }, (_, i) => Math.min(0.0012 + (i * 0.0022), 0.32)),
    female: Array.from({ length: 100 }, (_, i) => Math.min(0.001 + (i * 0.002), 0.27)),
  },
};

function calculateSurvivalProbability(age: number, gender: string, table: string, years: number): number {
  const rates = mortalityRates[table]?.[gender] || mortalityRates.TGH05.male;
  let probability = 1;
  
  for (let i = 0; i < years; i++) {
    const currentAge = age + i;
    if (currentAge >= rates.length) break;
    probability *= (1 - rates[currentAge]);
  }
  
  return probability;
}

function calculateLifeExpectancy(age: number, gender: string, table: string): number {
  const rates = mortalityRates[table]?.[gender] || mortalityRates.TGH05.male;
  let expectancy = 0;
  let probability = 1;
  
  for (let i = 0; i < 50; i++) {
    const currentAge = age + i;
    if (currentAge >= rates.length) break;
    
    probability *= (1 - rates[currentAge]);
    expectancy += probability;
    
    if (probability < 0.01) break;
  }
  
  return Math.round(expectancy * 10) / 10;
}

export function calculateAnnuity(params: CalculationParams): CalculationResult {
  const {
    annuityType,
    age,
    gender,
    interestRate,
    annualAmount,
    mortalityTable,
    duration = 30,
    deferralPeriod = 0,
    growthRate = 0,
    reversalRate = 60,
    spouseAge = age - 3,
  } = params;

  const discountRate = interestRate / 100;
  const lifeExpectancy = calculateLifeExpectancy(age, gender, mortalityTable);
  
  let presentValue = 0;
  let totalPayments = 0;
  const projections = [];

  // Calculate based on annuity type
  switch (annuityType) {
    case 'simple':
      presentValue = calculateSimpleAnnuity(age, gender, mortalityTable, annualAmount, discountRate);
      break;
      
    case 'reversible':
      presentValue = calculateReversibleAnnuity(
        age, gender, spouseAge!, mortalityTable, annualAmount, discountRate, reversalRate!
      );
      break;
      
    case 'temporary':
      presentValue = calculateTemporaryAnnuity(
        age, gender, mortalityTable, annualAmount, discountRate, duration
      );
      break;
      
    case 'deferred':
      presentValue = calculateDeferredAnnuity(
        age, gender, mortalityTable, annualAmount, discountRate, deferralPeriod!
      );
      break;
      
    case 'growing':
      presentValue = calculateGrowingAnnuity(
        age, gender, mortalityTable, annualAmount, discountRate, growthRate!
      );
      break;
      
    default:
      presentValue = calculateSimpleAnnuity(age, gender, mortalityTable, annualAmount, discountRate);
  }

  // Generate projections
  for (let year = 1; year <= Math.min(30, Math.ceil(lifeExpectancy)); year++) {
    const survivalProb = calculateSurvivalProbability(age, gender, mortalityTable, year);
    let payment = annualAmount;
    
    if (annuityType === 'growing') {
      payment = annualAmount * Math.pow(1 + growthRate! / 100, year - 1);
      )
    }
    
    if (annuityType === 'temporary' && year > duration) {
      payment = 0;
    }
    
    if (annuityType === 'deferred' && year <= deferralPeriod!) {
      payment = 0;
    }
    
    totalPayments += payment * survivalProb;
    
    projections.push({
      year,
      payment: Math.round(payment),
      cumulativePayment: Math.round(totalPayments),
      probability: Math.round(survivalProb * 100) / 100,
    });
  }

  return {
    presentValue: Math.round(presentValue),
    monthlyPayment: Math.round(annualAmount / 12),
    totalPayments: Math.round(totalPayments),
    lifeExpectancy,
    projections,
  };
}

function calculateSimpleAnnuity(
  age: number,
  gender: string,
  table: string,
  annualAmount: number,
  discountRate: number
): number {
  let pv = 0;
  
  for (let t = 1; t <= 50; t++) {
    const survivalProb = calculateSurvivalProbability(age, gender, table, t);
    const discountFactor = Math.pow(1 + discountRate, -t);
    pv += annualAmount * survivalProb * discountFactor;
    
    if (survivalProb < 0.01) break;
  }
  
  return pv;
}

function calculateReversibleAnnuity(
  age: number,
  gender: string,
  spouseAge: number,
  table: string,
  annualAmount: number,
  discountRate: number,
  reversalRate: number
): number {
  const primaryAnnuity = calculateSimpleAnnuity(age, gender, table, annualAmount, discountRate);
  const spouseGender = gender === 'male' ? 'female' : 'male';
  const reversalAmount = annualAmount * (reversalRate / 100);
  
  // Simplified calculation - in practice, this would involve joint life probabilities
  const spouseAnnuity = calculateSimpleAnnuity(spouseAge, spouseGender, table, reversalAmount, discountRate);
  
  return primaryAnnuity + spouseAnnuity * 0.6; // Approximate adjustment for joint probability
}

function calculateTemporaryAnnuity(
  age: number,
  gender: string,
  table: string,
  annualAmount: number,
  discountRate: number,
  duration: number
): number {
  let pv = 0;
  
  for (let t = 1; t <= duration; t++) {
    const survivalProb = calculateSurvivalProbability(age, gender, table, t);
    const discountFactor = Math.pow(1 + discountRate, -t);
    pv += annualAmount * survivalProb * discountFactor;
  }
  
  return pv;
}

function calculateDeferredAnnuity(
  age: number,
  gender: string,
  table: string,
  annualAmount: number,
  discountRate: number,
  deferralPeriod: number
): number {
  let pv = 0;
  
  for (let t = deferralPeriod + 1; t <= 50; t++) {
    const survivalProb = calculateSurvivalProbability(age, gender, table, t);
    const discountFactor = Math.pow(1 + discountRate, -t);
    pv += annualAmount * survivalProb * discountFactor;
    
    if (survivalProb < 0.01) break;
  }
  
  return pv;
}

function calculateGrowingAnnuity(
  age: number,
  gender: string,
  table: string,
  annualAmount: number,
  discountRate: number,
  growthRate: number
): number {
  let pv = 0;
  const realDiscountRate = (discountRate - growthRate / 100) / (1 + growthRate / 100);
  
  for (let t = 1; t <= 50; t++) {
    const survivalProb = calculateSurvivalProbability(age, gender, table, t);
    const payment = annualAmount * Math.pow(1 + growthRate / 100, t - 1);
    const discountFactor = Math.pow(1 + realDiscountRate, -t);
    pv += payment * survivalProb * discountFactor;
    
    if (survivalProb < 0.01) break;
  }
  
  return pv;
}