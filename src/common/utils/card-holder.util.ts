export class CardHolderUtil {
  static splitCardHolderName(fullName: string) {
    if (!fullName || fullName.trim() === '') {
      return { first_name: 'N/A', last_name: 'N/A' };
    }

    const parts = fullName.trim().split(/\s+/);
    const last_name = parts.pop();
    const first_name = parts.join(' ') || last_name;

    return { first_name, last_name };
  }
}
