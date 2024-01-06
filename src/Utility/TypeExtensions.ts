export abstract class ObjectExtensions {
    
    public static isNullOrUndefined(value: any): boolean {
        if(value == undefined || value == null) {
            return true;
        }
        else {
            return false;
        }
    }

    public static isEmptyString(value: string): boolean {
        if(value == "" && value.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }
}