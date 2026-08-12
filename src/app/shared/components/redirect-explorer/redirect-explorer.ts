import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-redirect-explorer',
  standalone: true,
  template: '',
})
export class RedirectExplorerComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    const match = this.router.url.match(/\/programas\/(\d+)\/versiones(?:\/(\d+))?(?:\/ediciones)?/);
    const queryParams: Record<string, string> = {};
    if (match) {
      queryParams['programa'] = match[1];
      if (match[2]) queryParams['version'] = match[2];
    }
    this.router.navigate(['/programas'], { queryParams, replaceUrl: true });
  }
}
