import { RegistrationForm } from "@/components/registration/registrationForm";
import type { RegistrationFormData } from "@/components/registration/registrationTypes";
import { View } from "react-native";

export default function Register() {
  const handleSubmit = (_data: RegistrationFormData): void => {
    // TODO: persist via writeSafeDBObject / writeEncryptedDBObject and navigate
  };

  return (
    <View style={{ flex: 1 }}>
      <RegistrationForm onSubmit={handleSubmit} />
    </View>
  );
}
