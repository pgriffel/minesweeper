import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: 'mmss_d' })
export class MinuteSecondsPipe implements PipeTransform {
    transform(millis: number): string {
        const decis = Math.floor(millis / 100);
        const seconds = Math.floor(decis / 10);
        const minutes = Math.floor(seconds / 60);
        return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}:${decis % 10}`;
    }
}
