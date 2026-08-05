export class ApprovalValidation {
  public static validateReject(reason: any): { isValid: boolean; message?: string } {
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return {
        isValid: false,
        message: 'A rejection reason is required and must be at least 5 characters long.',
      };
    }
    return { isValid: true };
  }

  public static validateApprove(confirm: any): { isValid: boolean; message?: string } {
    if (confirm !== true && confirm !== 'true') {
      return {
        isValid: false,
        message: 'Approval confirmation is required.',
      };
    }
    return { isValid: true };
  }
}
