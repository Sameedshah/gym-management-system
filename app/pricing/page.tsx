import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Standard",
    price: "$299",
    duration: "one-time",
    description: "Perfect for most gyms",
    features: [
      "Unlimited members",
      "Unlimited staff accounts",
      "Unlimited biometric devices",
      "Advanced reporting",
      "Email support",
      "Mobile responsive",
      "Payment tracking",
      "SMS & Email notifications",
      "Lifetime updates",
      "No monthly fees"
    ],
    cta: "Purchase Now",
    popular: true
  },
  {
    name: "Premium",
    price: "$499",
    duration: "one-time",
    description: "Enhanced features & priority support",
    features: [
      "Everything in Standard",
      "Priority support",
      "Custom branding",
      "API access",
      "Advanced analytics",
      "Multi-location support",
      "White-label options",
      "Dedicated onboarding",
      "Lifetime updates",
      "No monthly fees"
    ],
    cta: "Purchase Now",
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    duration: "one-time",
    description: "For large gyms and chains",
    features: [
      "Everything in Premium",
      "Custom development",
      "Dedicated account manager",
      "On-premise deployment option",
      "Custom integrations",
      "SLA guarantee",
      "Training & workshops",
      "24/7 priority support",
      "Lifetime updates",
      "No monthly fees"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GymAdmin Pro</h1>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">One-Time Purchase, Lifetime Access</h2>
        <p className="text-xl text-muted-foreground mb-8">
          No monthly fees. No hidden costs. Pay once, use forever.
        </p>
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
          <Check className="h-4 w-4" />
          <span className="font-medium">Lifetime Updates Included</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                {plan.popular && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Free" && (
                    <span className="text-muted-foreground ml-2">{plan.duration}</span>
                  )}
                  {plan.price === "Free" && (
                    <span className="text-muted-foreground ml-2">{plan.duration}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="block">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16 border-t">
        <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Is this really a one-time payment?</h4>
            <p className="text-muted-foreground">
              Yes! Pay once and use the software forever. No monthly fees, no recurring charges. You own your license.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What about updates?</h4>
            <p className="text-muted-foreground">
              All licenses include lifetime updates. You'll always have access to the latest features and security patches at no extra cost.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Can I upgrade later?</h4>
            <p className="text-muted-foreground">
              Yes! You can upgrade from Standard to Premium or Enterprise at any time by paying the difference.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What biometric devices are supported?</h4>
            <p className="text-muted-foreground">
              We support Hikvision, ZKTeco, Suprema, Anviz, eSSL, and many other brands. Our universal setup wizard makes configuration easy.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Is my data secure?</h4>
            <p className="text-muted-foreground">
              Absolutely! We use enterprise-grade security with complete data isolation, encrypted connections, and regular backups.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Do you offer support?</h4>
            <p className="text-muted-foreground">
              Yes! All plans include email support. Premium and Enterprise plans get priority support, and Enterprise includes a dedicated account manager.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Do you offer a demo?</h4>
            <p className="text-muted-foreground">
              Yes! Contact us for a live demo or create a test account to explore all features before purchasing.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center border-t">
        <h3 className="text-3xl font-bold mb-4">Ready to own your gym management software?</h3>
        <p className="text-xl text-muted-foreground mb-8">
          Join hundreds of gyms using GymAdmin Pro with no monthly fees
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Request Demo</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 GymAdmin Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}