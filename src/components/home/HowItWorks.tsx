import { Card, CardContent } from '@/components/ui/card';
import { FileText, Brain, Bell, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: FileText,
      title: t('step_1_title'),
      description: t('step_1_desc'),
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Brain,
      title: t('step_2_title'),
      description: t('step_2_desc'),
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: Bell,
      title: t('step_3_title'),
      description: t('step_3_desc'),
      color: 'bg-success/10 text-success',
    },
    {
      icon: CheckCircle,
      title: t('step_4_title'),
      description: t('step_4_desc'),
      color: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <section className="mb-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">{t('how_it_works')}</h2>
        <p className="text-muted-foreground mt-2">{t('how_it_works_subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={index}
              variant="elevated"
              className="text-center animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="pt-8 pb-6">
                {/* Step Number */}
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </div>

                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-8 w-8" />
                </div>

                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
