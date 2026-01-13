import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddEmployeeForm } from "@/components/admin/AddEmployeeForm";
import { EmployeeList } from "@/components/admin/EmployeeList";
import { Shield, Users, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AdminControl() {
  const [activeTab, setActiveTab] = useState("manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control</h1>
        <p className="text-muted-foreground">
          Manage employees, roles, and system permissions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md", 
            activeTab === "manage" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50"
          )}
          onClick={() => setActiveTab("manage")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Employees</CardTitle>
            <Users className={cn("h-4 w-4", activeTab === "manage" ? "text-primary" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Directory</div>
            <p className="text-xs text-muted-foreground">
              View and manage all employees
            </p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md", 
            activeTab === "add" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50"
          )}
          onClick={() => setActiveTab("add")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add Employee</CardTitle>
            <UserPlus className={cn("h-4 w-4", activeTab === "add" ? "text-primary" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Onboard</div>
            <p className="text-xs text-muted-foreground">
              Register new staff members
            </p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md", 
            activeTab === "roles" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50"
          )}
          onClick={() => setActiveTab("roles")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles & Permissions</CardTitle>
            <Shield className={cn("h-4 w-4", activeTab === "roles" ? "text-primary" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Access</div>
            <p className="text-xs text-muted-foreground">
              Configure roles and access levels
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>
                View and manage all employees in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <div className="max-w-4xl">
            <AddEmployeeForm />
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Manage user roles and access levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Roles can be managed directly in the "Manage Employees" tab by editing an employee's profile.
                  The following roles are available in the system:
                </p>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" /> Admin
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Full access to all system features, including settings and user management.</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" /> HR
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Access to employee management, payroll, and leave requests.</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" /> Driver
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Access to driver dashboard, deliveries, and vehicle management.</p>
                  </div>

                  <div className="p-4 border rounded-lg bg-card">
                    <div className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" /> User / Member
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Standard access to basic features.</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Quick Role Update</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    To update a user's role, go to the <strong>Manage Employees</strong> tab, click the actions menu (three dots) next to the user, and select "Edit Details".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}