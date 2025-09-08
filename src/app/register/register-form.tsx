
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { registerUser } from '@/register/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Textarea } from '@/components/ui/textarea';

const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Lakshadweep", "Puducherry"
];
const OTHER_VALUE = 'Other';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: "Please select your gender."
  }),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  pinCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code.").optional().or(z.literal('')),
  state: z.string().optional(),
  otherState: z.string().optional(),
}).refine(data => {
    // If state is 'Other', then otherState must not be empty.
    if (data.state === OTHER_VALUE) {
        return data.otherState && data.otherState.trim().length > 0;
    }
    return true;
}, {
    message: "Please specify the state name.",
    path: ["otherState"],
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      mobileNumber: '',
      addressLine1: '',
      city: '',
      district: '',
      pinCode: '',
      state: '',
      otherState: '',
    },
  });
  
  const selectedState = form.watch("state");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);

    try {
      const stateValue = values.state === OTHER_VALUE ? values.otherState : values.state;
      // Combine address fields into a single string for the server action
      const fullAddress = (values.addressLine1 || values.city || values.district || values.pinCode || stateValue) 
        ? `${values.addressLine1}, City: ${values.city}, Dist: ${values.district}, PIN: ${values.pinCode}, ${stateValue}, India` 
        : '';
        
      const registrationPayload = {
          name: values.name,
          email: values.email,
          password: values.password,
          mobileNumber: values.mobileNumber,
          gender: values.gender,
          address: fullAddress,
      };
      
      const result = await registerUser(registrationPayload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to register user.');
      }

      // 2. Automatically log the new user in on the client
      if (!auth) {
        throw new Error("Firebase client not available to log in.");
      }
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 3. Get the ID token and create the session via API route
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session after registration.');
      }

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Redirecting...",
      });

      // Full page redirect to ensure session is active
      window.location.href = '/';

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="9876543210" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center space-x-6"
                  disabled={isLoading}
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="male" />
                    </FormControl>
                    <FormLabel className="font-normal">Male</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="female" />
                    </FormControl>
                    <FormLabel className="font-normal">Female</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="other" />
                    </FormControl>
                    <FormLabel className="font-normal">Other</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-base font-medium">Shipping Address (Optional)</h3>
            <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                        <Input placeholder="Street address, P.O. box, etc." {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Guwahati" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Kamrup" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="pinCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. 781001" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>State</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {indianStates.map(state => (
                                        <SelectItem key={state} value={state}>{state}</SelectItem>
                                    ))}
                                    <SelectItem value={OTHER_VALUE}>Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            {selectedState === OTHER_VALUE && (
                <FormField
                    control={form.control}
                    name="otherState"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Please Specify State</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter state name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}
