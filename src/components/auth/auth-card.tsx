
import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export const AuthCard = ({ title, description, children, footerContent }: AuthCardProps) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footerContent && (
        <CardFooter>
            {footerContent}
        </CardFooter>
      )}
    </Card>
  );
};
