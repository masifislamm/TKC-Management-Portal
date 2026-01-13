import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Truck } from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to TKC</h1>
          <p className="text-muted-foreground text-lg">Select your portal to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <Card 
              className="h-full hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden"
              onClick={() => navigate("/auth")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="text-center pt-12 pb-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Admin Portal</CardTitle>
                <CardDescription>
                  Manage operations, expenses, and HR
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <Button className="w-full max-w-[200px]" onClick={() => navigate("/auth")}>
                  Login as Admin
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
            <Card 
              className="h-full hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden"
              onClick={() => navigate("/driver-login")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="text-center pt-12 pb-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Driver Portal</CardTitle>
                <CardDescription>
                  View assignments and track deliveries
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <Button variant="outline" className="w-full max-w-[200px]" onClick={() => navigate("/driver-login")}>
                  Login as Driver
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground pt-8">
          © 2026 TKC
        </div>
      </div>
    </div>
  );
}