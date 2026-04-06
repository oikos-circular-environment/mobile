import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Search, Sprout } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { z } from "zod";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

const searchSchema = z.object({
  query: z
    .string()
    .trim()
    .max(80, "A pesquisa deve ter no máximo 80 caracteres."),
});

type SearchFormValues = z.infer<typeof searchSchema>;

const mockMarketItems = [
  {
    id: "grupo-alemao",
    name: "Grupo Alemão",
    description: "Alumínio, ferro, cobre, aerossol, panelas de ferro, panela",
    badge: null as string | null,
    initials: "GA",
    avatarClassName: "bg-slate-950",
    textClassName: "text-white",
  },
  {
    id: "sucatao-do-dinao",
    name: "Sucatão do Dinão",
    description: "Alumínio, ferro, cobre, aerossol, panelas de ferro, panela",
    badge: null as string | null,
    initials: "SD",
    avatarClassName: "bg-blue-600",
    textClassName: "text-white",
  },
  {
    id: "henrique-flores",
    name: "Henrique Flores",
    description: "Alumínio, ferro, cobre, aerossol, panelas de ferro, panela",
    badge: "Coletor independente",
    initials: null as string | null,
    avatarClassName: "bg-gray-200",
    textClassName: "text-gray-950",
  },
];

export default function MarketScreen() {
  const [appliedQuery, setAppliedQuery] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
    },
  });

  const visibleItems = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return mockMarketItems;
    }

    return mockMarketItems.filter(item => {
      const searchableText =
        `${item.name} ${item.description} ${item.badge ?? ""}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [appliedQuery]);

  const onSubmit = (data: SearchFormValues) => {
    setAppliedQuery(data.query);
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="p-4 pb-8"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="gap-8">
          <FormControl isInvalid={!!errors.query} className="gap-2">
            <View className="flex-row items-end gap-2">
              <View className="flex-1 gap-2">
                <FormControlLabel>
                  <FormControlLabelText className="sr-only">
                    Busca
                  </FormControlLabelText>
                </FormControlLabel>
                <Controller
                  control={control}
                  name="query"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input className="rounded-md border-gray-200 bg-white">
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Lata"
                        placeholderTextColor="#9CA3AF"
                        className="text-sm"
                      />
                      <InputSlot>
                        <InputIcon as={Search} className="text-gray-400" />
                      </InputSlot>
                    </Input>
                  )}
                />
              </View>

              <Button
                onPress={handleSubmit(onSubmit)}
                isDisabled={isSubmitting}
                className="h-10 rounded-md bg-primary px-4"
              >
                <ButtonText className="text-sm">Pesquisar</ButtonText>
              </Button>
            </View>

            <Text className="text-xs text-gray-400">
              Pesquise por empresas, resíduo ou serviços.
            </Text>

            {errors.query?.message ? (
              <Text className="text-xs text-destructive">
                {errors.query.message}
              </Text>
            ) : null}
          </FormControl>

          <View className="gap-4">
            <View className="gap-1">
              <Heading className="text-xl text-black">Lista</Heading>
              <Text className="text-xs leading-4 text-gray-400">
                A listagem irá oferecer a ocorrencia de acordo com sua pesquisa,
                clique na empresa para obter mais informações.
              </Text>
            </View>

            <View className="gap-3">
              {visibleItems.map(item => (
                <Pressable key={item.id}>
                  <Card size="sm" className="border-0 bg-gray-100 shadow-none">
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`h-8 w-8 items-center justify-center overflow-hidden rounded-[5px] ${item.avatarClassName}`}
                      >
                        {item.initials ? (
                          <Text
                            className={`text-[10px] font-semibold ${item.textClassName}`}
                          >
                            {item.initials}
                          </Text>
                        ) : (
                          <Sprout size={16} color="#111827" />
                        )}
                      </View>

                      <View className="min-w-0 flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-1 text-sm font-semibold text-gray-950">
                            {item.name}
                          </Text>

                          {item.badge ? (
                            <View className="rounded-[5px] bg-primary px-3 py-1">
                              <Text className="text-[8px] text-white">
                                {item.badge}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text className="text-xs leading-4 text-gray-500">
                          {item.description}
                        </Text>
                      </View>

                      <ArrowRight size={16} color="#111827" />
                    </View>
                  </Card>
                </Pressable>
              ))}

              {visibleItems.length === 0 ? (
                <Card size="sm" className="border-0 bg-gray-100 shadow-none">
                  <Text className="text-sm text-gray-500">
                    Nenhum ponto de coleta encontrado para esta pesquisa.
                  </Text>
                </Card>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
