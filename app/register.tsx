import { RegistrationForm } from "@/components/registration/registrationForm";
import type { RegistrationFormData } from "@/components/registration/registrationTypes";
import { View } from "react-native";

export default function Register() {
  const handleSubmit = (_data: RegistrationFormData): void => {
    // Persistence runs inside RegistrationForm (save step); hook for analytics/tests.
  };

  return (
    <View style={{ flex: 1 }}>
      <RegistrationForm onSubmit={handleSubmit} />
    </View>
  );
}
